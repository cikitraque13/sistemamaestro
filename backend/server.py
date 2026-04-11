from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import secrets
import httpx
import re
from bs4 import BeautifulSoup
from urllib.parse import urlparse

# Emergency integrations
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
)

ROOT_DIR = Path(__file__).parent

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_hex(32))

# LLM Key - supports both OPENAI_API_KEY and EMERGENT_LLM_KEY
def get_llm_api_key():
    """Get LLM API key - prioritize OPENAI_API_KEY, fallback to EMERGENT_LLM_KEY"""
    key = os.environ.get("OPENAI_API_KEY") or os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        raise ValueError("Missing LLM API key. Set OPENAI_API_KEY or EMERGENT_LLM_KEY in environment")
    return key

# Plan Configuration
PLANS = {
    "free": {"name": "Gratis", "price": 0.0, "features": ["diagnosis", "route"]},
    "blueprint": {"name": "Blueprint", "price": 29.0, "features": ["diagnosis", "route", "blueprint", "priorities"]},
    "sistema": {"name": "Sistema", "price": 79.0, "features": ["diagnosis", "route", "blueprint", "priorities", "continuity", "deployment"]},
    "premium": {"name": "Premium", "price": 199.0, "features": ["diagnosis", "route", "blueprint", "priorities", "continuity", "deployment", "support", "opportunities"]}
}

# Create the main app
app = FastAPI(title="Sistema Maestro API", description="Plataforma guiada de transformación digital")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    role: str = "user"
    plan: str = "free"
    created_at: datetime

class ProjectCreate(BaseModel):
    input_type: str = Field(..., description="text or url")
    input_content: str
    
class ProjectRefine(BaseModel):
    project_id: str
    answers: Dict[str, str]

class ProjectResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    project_id: str
    user_id: str
    input_type: str
    input_content: str
    route: Optional[str] = None
    status: str = "pending"
    diagnosis: Optional[Dict[str, Any]] = None
    blueprint: Optional[Dict[str, Any]] = None
    refine_questions: Optional[List[Dict[str, str]]] = None
    refine_answers: Optional[Dict[str, str]] = None
    created_at: datetime
    updated_at: datetime

class OpportunityResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    opportunity_id: str
    title: str
    description: str
    business_logic: str
    monetization_model: str
    digital_asset_format: str
    first_steps: List[str]
    difficulty: str
    recommended_route: str

class CheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str

class NewsletterSubscribe(BaseModel):
    email: EmailStr

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def get_jwt_secret() -> str:
    return JWT_SECRET

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    # Try cookie first
    token = request.cookies.get("access_token")
    if not token:
        # Try session_token cookie (Google OAuth)
        session_token = request.cookies.get("session_token")
        if session_token:
            session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
            if session:
                expires_at = session["expires_at"]
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at)
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                if expires_at > datetime.now(timezone.utc):
                    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password_hash": 0})
                    if user:
                        return user
        # Try Authorization header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def check_brute_force(identifier: str):
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt:
        if attempt.get("locked_until"):
            locked_until = attempt["locked_until"]
            if isinstance(locked_until, str):
                locked_until = datetime.fromisoformat(locked_until)
            if locked_until.tzinfo is None:
                locked_until = locked_until.replace(tzinfo=timezone.utc)
            if locked_until > datetime.now(timezone.utc):
                raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")
            else:
                await db.login_attempts.delete_one({"identifier": identifier})

async def record_failed_attempt(identifier: str):
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt:
        new_count = attempt.get("count", 0) + 1
        update = {"$set": {"count": new_count}}
        if new_count >= 5:
            update["$set"]["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        await db.login_attempts.update_one({"identifier": identifier}, update)
    else:
        await db.login_attempts.insert_one({"identifier": identifier, "count": 1})

async def clear_failed_attempts(identifier: str):
    await db.login_attempts.delete_one({"identifier": identifier})

# ==================== URL ANALYSIS ====================

async def fetch_and_analyze_url(url: str) -> Dict[str, Any]:
    """Fetch URL content and extract key information for analysis"""
    
    # Validate and normalize URL
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    try:
        parsed = urlparse(url)
        if not parsed.netloc:
            return {"error": "URL inválida", "content": None}
    except Exception:
        return {"error": "URL inválida", "content": None}
    
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            response = await client.get(url, headers=headers)
            
            if response.status_code != 200:
                return {"error": f"No se pudo acceder a la web (código {response.status_code})", "content": None}
            
            html = response.text
            soup = BeautifulSoup(html, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "noscript", "iframe"]):
                script.decompose()
            
            # Extract data
            title = soup.title.string.strip() if soup.title and soup.title.string else ""
            
            # Meta description
            meta_desc = ""
            meta_tag = soup.find("meta", attrs={"name": "description"})
            if meta_tag and meta_tag.get("content"):
                meta_desc = meta_tag["content"].strip()
            
            # H1 and H2
            h1_tags = [h.get_text().strip() for h in soup.find_all("h1")][:3]
            h2_tags = [h.get_text().strip() for h in soup.find_all("h2")][:5]
            
            # Main text content (paragraphs)
            paragraphs = []
            for p in soup.find_all("p"):
                text = p.get_text().strip()
                if len(text) > 30:
                    paragraphs.append(text)
                if len(paragraphs) >= 5:
                    break
            
            # CTAs (buttons and links with action text)
            ctas = []
            cta_patterns = re.compile(r'(comprar|buy|subscribe|suscribir|registr|sign up|contact|comenzar|empezar|start|get started|free trial|prueba|demo)', re.I)
            for el in soup.find_all(['button', 'a']):
                text = el.get_text().strip()
                if text and cta_patterns.search(text) and len(text) < 50:
                    ctas.append(text)
                if len(ctas) >= 5:
                    break
            
            # Forms
            forms = []
            for form in soup.find_all("form"):
                form_inputs = [inp.get("name") or inp.get("placeholder") for inp in form.find_all(["input", "textarea"]) if inp.get("type") != "hidden"]
                if form_inputs:
                    forms.append({"inputs": form_inputs[:5]})
                if len(forms) >= 3:
                    break
            
            # Navigation
            nav_items = []
            nav = soup.find("nav") or soup.find("header")
            if nav:
                for link in nav.find_all("a"):
                    text = link.get_text().strip()
                    if text and len(text) < 30:
                        nav_items.append(text)
                    if len(nav_items) >= 8:
                        break
            
            return {
                "error": None,
                "content": {
                    "url": url,
                    "domain": parsed.netloc,
                    "title": title[:200] if title else "",
                    "meta_description": meta_desc[:300] if meta_desc else "",
                    "h1": h1_tags,
                    "h2": h2_tags,
                    "main_text": paragraphs,
                    "ctas": ctas,
                    "forms": forms,
                    "navigation": nav_items
                }
            }
            
    except httpx.TimeoutException:
        return {"error": "Tiempo de espera agotado al acceder a la web", "content": None}
    except httpx.RequestError as e:
        return {"error": f"Error de conexión: no se pudo acceder a {parsed.netloc}", "content": None}
    except Exception as e:
        logger.error(f"URL analysis error: {e}")
        return {"error": "Error al analizar la web", "content": None}

# ==================== AI ANALYSIS ====================

async def analyze_input(input_type: str, input_content: str) -> Dict[str, Any]:
    """Analyze user input using GPT to classify route and generate diagnosis"""
    
    try:
        api_key = get_llm_api_key()
    except ValueError as e:
        logger.error(f"LLM key error: {e}")
        return {
            "error": "Sistema de análisis no configurado. Contacta al administrador.",
            "route": None,
            "diagnosis": None
        }
    
    # If URL, fetch and analyze the actual content
    url_analysis = None
    if input_type == "url":
        url_analysis = await fetch_and_analyze_url(input_content)
        if url_analysis.get("error"):
            return {
                "error": url_analysis["error"],
                "route": "improve_existing",
                "diagnosis": {
                    "understanding": f"Intentamos analizar {input_content} pero encontramos un problema.",
                    "main_finding": url_analysis["error"],
                    "opportunity": "Verifica que la URL sea correcta y accesible públicamente."
                },
                "next_step": "Intenta con otra URL o describe tu proyecto en texto."
            }
    
    system_prompt = """Eres Sistema Maestro, un experto en transformación digital. Tu trabajo es analizar la entrada del usuario y clasificarla en UNA de estas 4 rutas:

1. "improve_existing" - Mejorar algo existente (URLs, sitios web, activos digitales existentes)
2. "sell_and_charge" - Vender y cobrar (servicios, productos, ofertas comerciales)
3. "automate_operation" - Automatizar una operación simple (tareas repetitivas, cuellos de botella)
4. "idea_to_project" - Convertir una idea en proyecto digital monetizable

Responde SIEMPRE en JSON con esta estructura exacta:
{
    "route": "improve_existing|sell_and_charge|automate_operation|idea_to_project",
    "diagnosis": {
        "understanding": "Frase que demuestra que entendiste la necesidad específica",
        "main_finding": "El hallazgo o problema principal detectado - sé específico y directo",
        "opportunity": "La oportunidad principal identificada - sé concreto"
    },
    "next_step": "Recomendación clara y accionable del siguiente paso",
    "refine_questions": [
        {"id": "q1", "question": "Pregunta de afinado relevante 1"},
        {"id": "q2", "question": "Pregunta de afinado relevante 2"},
        {"id": "q3", "question": "Pregunta de afinado relevante 3"}
    ]
}

IMPORTANTE:
- Sé directo, profesional y específico
- El diagnóstico debe sentirse personalizado, no genérico
- Máximo 3 preguntas de afinado
- Si es una URL, analiza el contenido real que te proporciono"""

    chat = LlmChat(
        api_key=api_key,
        session_id=f"sistemamaestro_{uuid.uuid4().hex[:8]}",
        system_message=system_prompt
    ).with_model("openai", "gpt-5.2")
    
    # Build the prompt
    if input_type == "url" and url_analysis and url_analysis.get("content"):
        content = url_analysis["content"]
        user_prompt = f"""Analiza esta web existente:

URL: {content['url']}
Dominio: {content['domain']}

TÍTULO: {content['title']}

META DESCRIPCIÓN: {content['meta_description']}

ENCABEZADOS H1: {', '.join(content['h1']) if content['h1'] else 'No encontrados'}

ENCABEZADOS H2: {', '.join(content['h2']) if content['h2'] else 'No encontrados'}

TEXTO PRINCIPAL:
{chr(10).join(content['main_text'][:3]) if content['main_text'] else 'No extraído'}

CTAs ENCONTRADOS: {', '.join(content['ctas']) if content['ctas'] else 'No encontrados'}

FORMULARIOS: {len(content['forms'])} encontrados

NAVEGACIÓN: {', '.join(content['navigation']) if content['navigation'] else 'No encontrada'}

Basándote en este análisis real de la web, identifica problemas concretos y oportunidades de mejora."""
    else:
        user_prompt = f"Tipo de entrada: {input_type}\nContenido: {input_content}"
    
    try:
        response = await chat.send_message(UserMessage(text=user_prompt))
        import json
        # Try to parse JSON from response
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        result = json.loads(response_text.strip())
        
        # Add URL analysis data if available
        if url_analysis and url_analysis.get("content"):
            result["url_analysis"] = url_analysis["content"]
        
        return result
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        return {
            "route": "idea_to_project",
            "diagnosis": {
                "understanding": "Hemos recibido tu entrada y estamos procesándola",
                "main_finding": "Necesitamos más información para darte un diagnóstico preciso",
                "opportunity": "Hay potencial para crear una solución digital efectiva"
            },
            "next_step": "Responde algunas preguntas para afinar el diagnóstico",
            "refine_questions": [
                {"id": "q1", "question": "¿Cuál es el objetivo principal que quieres lograr?"},
                {"id": "q2", "question": "¿Ya tienes algo construido o empiezas desde cero?"},
                {"id": "q3", "question": "¿Cuál es tu mayor obstáculo actual?"}
            ]
        }

async def generate_blueprint(project: dict) -> Dict[str, Any]:
    """Generate a detailed blueprint based on project data"""
    
    try:
        api_key = get_llm_api_key()
    except ValueError:
        return {
            "title": "Blueprint no disponible",
            "summary": "El sistema de generación no está configurado",
            "error": True
        }
    
    route_names = {
        "improve_existing": "Mejorar algo existente",
        "sell_and_charge": "Vender y cobrar",
        "automate_operation": "Automatizar operación",
        "idea_to_project": "Idea a proyecto"
    }
    
    system_prompt = """Eres Sistema Maestro. Genera un blueprint detallado y profesional para el proyecto.

Responde en JSON:
{
    "title": "Título descriptivo del blueprint",
    "summary": "Resumen ejecutivo de 2-3 oraciones",
    "priorities": ["Prioridad 1", "Prioridad 2", "Prioridad 3"],
    "architecture": {
        "components": ["Componente 1", "Componente 2"],
        "tech_stack": ["Tecnología 1", "Tecnología 2"],
        "integrations": ["Integración 1"]
    },
    "monetization": "Estrategia de monetización recomendada con números concretos si es posible",
    "deployment_steps": ["Paso 1", "Paso 2", "Paso 3", "Paso 4"],
    "timeline_estimate": "Estimación de tiempo realista",
    "key_metrics": ["Métrica 1 a seguir", "Métrica 2 a seguir"]
}

Sé específico y práctico. Evita generalidades."""

    chat = LlmChat(
        api_key=api_key,
        session_id=f"blueprint_{uuid.uuid4().hex[:8]}",
        system_message=system_prompt
    ).with_model("openai", "gpt-5.2")
    
    context = f"""
Ruta: {route_names.get(project.get('route', ''), 'General')}
Entrada original: {project.get('input_content', '')}
Diagnóstico: {project.get('diagnosis', {})}
Respuestas de afinado: {project.get('refine_answers', {})}
Análisis de URL: {project.get('url_analysis', 'N/A')}
"""
    
    try:
        response = await chat.send_message(UserMessage(text=context))
        import json
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        return json.loads(response_text.strip())
    except Exception as e:
        logger.error(f"Blueprint generation error: {e}")
        return {
            "title": f"Blueprint: {route_names.get(project.get('route', ''), 'Proyecto')}",
            "summary": "Blueprint generado para tu proyecto",
            "priorities": ["Definir alcance", "Crear MVP", "Iterar con feedback"],
            "architecture": {"components": ["Frontend", "Backend", "Database"]},
            "monetization": "Por definir según validación",
            "deployment_steps": ["Configurar entorno", "Desarrollar MVP", "Testing", "Lanzamiento"],
            "timeline_estimate": "4-8 semanas"
        }

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "role": "user",
        "plan": "free",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"user_id": user_id, "email": email, "name": user_data.name, "role": "user", "plan": "free"}

@api_router.post("/auth/login")
async def login(user_data: UserLogin, request: Request, response: Response):
    email = user_data.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    
    await check_brute_force(identifier)
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user.get("password_hash", "")):
        await record_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    await clear_failed_attempts(identifier)
    
    access_token = create_access_token(user["user_id"], email)
    refresh_token = create_refresh_token(user["user_id"])
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    user.pop("password_hash", None)
    return user

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    
    try:
        payload = jwt.decode(refresh_token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        new_access_token = create_access_token(user["user_id"], user["email"])
        response.set_cookie(key="access_token", value=new_access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
        
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ==================== GOOGLE OAUTH ====================

@api_router.post("/auth/google/session")
async def google_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        google_data = resp.json()
    
    email = google_data["email"].lower()
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": google_data.get("name", existing_user.get("name")), "picture": google_data.get("picture")}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": google_data.get("name", "User"),
            "picture": google_data.get("picture"),
            "role": "user",
            "plan": "free",
            "google_id": google_data.get("id"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    session_token = google_data.get("session_token", secrets.token_urlsafe(32))
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=604800,
        path="/"
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return user

# ==================== NEWSLETTER ====================

@api_router.post("/newsletter/subscribe")
async def subscribe_newsletter(data: NewsletterSubscribe):
    email = data.email.lower()
    
    existing = await db.newsletter_subscribers.find_one({"email": email})
    if existing:
        return {"message": "Ya estás suscrito", "subscribed": True}
    
    await db.newsletter_subscribers.insert_one({
        "email": email,
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
        "source": "website"
    })
    
    return {"message": "Suscripción exitosa", "subscribed": True}

# ==================== PROJECT ROUTES ====================

@api_router.post("/projects")
async def create_project(project_data: ProjectCreate, request: Request):
    user = await get_current_user(request)
    
    project_id = f"proj_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    # Analyze input with AI
    analysis = await analyze_input(project_data.input_type, project_data.input_content)
    
    # Check for errors
    if analysis.get("error") and not analysis.get("route"):
        raise HTTPException(status_code=400, detail=analysis["error"])
    
    project_doc = {
        "project_id": project_id,
        "user_id": user["user_id"],
        "input_type": project_data.input_type,
        "input_content": project_data.input_content,
        "route": analysis.get("route"),
        "status": "analyzed",
        "diagnosis": analysis.get("diagnosis"),
        "refine_questions": analysis.get("refine_questions", []),
        "next_step": analysis.get("next_step"),
        "url_analysis": analysis.get("url_analysis"),
        "created_at": now,
        "updated_at": now
    }
    
    await db.projects.insert_one(project_doc)
    project_doc.pop("_id", None)
    return project_doc

@api_router.post("/projects/{project_id}/refine")
async def refine_project(project_id: str, refine_data: ProjectRefine, request: Request):
    user = await get_current_user(request)
    
    project = await db.projects.find_one(
        {"project_id": project_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.projects.update_one(
        {"project_id": project_id},
        {
            "$set": {
                "refine_answers": refine_data.answers,
                "status": "refined",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    return project

@api_router.post("/projects/{project_id}/blueprint")
async def generate_project_blueprint(project_id: str, request: Request):
    user = await get_current_user(request)
    
    # Check user plan
    if user.get("plan") == "free":
        raise HTTPException(status_code=403, detail="Upgrade to Blueprint plan to unlock this feature")
    
    project = await db.projects.find_one(
        {"project_id": project_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    blueprint = await generate_blueprint(project)
    
    await db.projects.update_one(
        {"project_id": project_id},
        {
            "$set": {
                "blueprint": blueprint,
                "status": "blueprint_generated",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    return project

@api_router.get("/projects")
async def get_projects(request: Request):
    user = await get_current_user(request)
    projects = await db.projects.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return projects

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str, request: Request):
    user = await get_current_user(request)
    project = await db.projects.find_one(
        {"project_id": project_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.projects.delete_one(
        {"project_id": project_id, "user_id": user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted"}

# ==================== OPPORTUNITIES ====================

OPPORTUNITIES = [
    {
        "opportunity_id": "opp_001",
        "title": "Micro-SaaS de Automatización de Emails",
        "description": "Herramienta que automatiza respuestas de email para freelancers y pequeños negocios",
        "business_logic": "Los usuarios pagan por volumen de emails procesados o suscripción mensual",
        "monetization_model": "SaaS con tiers: Free (50 emails/mes), Pro ($19/mes, 500 emails), Business ($49/mes, ilimitado)",
        "digital_asset_format": "Aplicación web con integración Gmail/Outlook",
        "first_steps": ["Validar demanda con landing page", "Crear MVP con integración Gmail", "Lanzar en Product Hunt"],
        "difficulty": "media",
        "recommended_route": "automate_operation"
    },
    {
        "opportunity_id": "opp_002",
        "title": "Directorio de Nichos Específicos",
        "description": "Directorio curado para un nicho específico (ej: agencias de marketing, estudios de tatuaje)",
        "business_logic": "Monetización vía listados premium y leads cualificados",
        "monetization_model": "Freemium: Listado básico gratis, Premium ($29/mes) con posicionamiento y leads",
        "digital_asset_format": "Sitio web con buscador y perfiles",
        "first_steps": ["Elegir nicho con demanda", "Scrapear 100 primeros listados", "Validar con 10 negocios"],
        "difficulty": "baja",
        "recommended_route": "idea_to_project"
    },
    {
        "opportunity_id": "opp_003",
        "title": "Kit de Plantillas para Notion/Airtable",
        "description": "Colección de plantillas profesionales para gestión de proyectos",
        "business_logic": "Venta única de paquetes de plantillas + upsell de personalización",
        "monetization_model": "Producto digital: Pack básico ($29), Pack completo ($79), Custom ($199+)",
        "digital_asset_format": "Plantillas descargables + tutoriales en video",
        "first_steps": ["Crear 3 plantillas core", "Grabar videos de uso", "Vender en Gumroad/Lemon Squeezy"],
        "difficulty": "baja",
        "recommended_route": "sell_and_charge"
    },
    {
        "opportunity_id": "opp_004",
        "title": "Auditoría Web Automatizada",
        "description": "Servicio que analiza sitios web y genera reportes de mejora automáticos",
        "business_logic": "Lead magnet gratuito que convierte a servicios premium",
        "monetization_model": "Freemium: Análisis básico gratis, Reporte completo ($49), Consultoría ($299)",
        "digital_asset_format": "Herramienta web con PDF generator",
        "first_steps": ["Crear algoritmo de análisis", "Diseñar reporte PDF", "Integrar con Stripe"],
        "difficulty": "alta",
        "recommended_route": "improve_existing"
    },
    {
        "opportunity_id": "opp_005",
        "title": "Comunidad de Pago por Nicho",
        "description": "Comunidad privada con contenido exclusivo y networking",
        "business_logic": "Membresía recurrente con contenido y acceso a expertos",
        "monetization_model": "Suscripción: $29/mes o $249/año",
        "digital_asset_format": "Plataforma de comunidad (Circle, Skool, Discord)",
        "first_steps": ["Definir propuesta de valor única", "Crear contenido fundacional", "Lanzar con 50 fundadores"],
        "difficulty": "media",
        "recommended_route": "sell_and_charge"
    }
]

@api_router.get("/opportunities")
async def get_opportunities(request: Request):
    user = await get_current_user(request)
    
    # Limit opportunities for free users
    if user.get("plan") == "free":
        return OPPORTUNITIES[:2]  # Only show 2 opportunities
    elif user.get("plan") in ["blueprint", "sistema"]:
        return OPPORTUNITIES[:4]
    
    return OPPORTUNITIES

@api_router.get("/opportunities/{opportunity_id}")
async def get_opportunity(opportunity_id: str, request: Request):
    user = await get_current_user(request)
    
    for opp in OPPORTUNITIES:
        if opp["opportunity_id"] == opportunity_id:
            # Check access
            index = OPPORTUNITIES.index(opp)
            if user.get("plan") == "free" and index >= 2:
                raise HTTPException(status_code=403, detail="Upgrade to access more opportunities")
            return opp
    
    raise HTTPException(status_code=404, detail="Opportunity not found")

# ==================== PAYMENTS ====================

@api_router.post("/payments/checkout")
async def create_checkout(checkout_data: CheckoutRequest, request: Request):
    user = await get_current_user(request)
    
    if checkout_data.plan_id not in PLANS or checkout_data.plan_id == "free":
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    plan = PLANS[checkout_data.plan_id]
    amount = plan["price"]
    
    stripe_api_key = os.environ.get("STRIPE_API_KEY") or os.environ.get("STRIPE_SECRET_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Payment system not configured. Set STRIPE_SECRET_KEY in environment.")
    
    host_url = checkout_data.origin_url.rstrip("/")
    success_url = f"{host_url}/dashboard/billing?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/dashboard/billing"
    
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    checkout_request = CheckoutSessionRequest(
        amount=float(amount),
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["user_id"],
            "plan_id": checkout_data.plan_id,
            "user_email": user["email"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    await db.payment_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "user_email": user["email"],
        "plan_id": checkout_data.plan_id,
        "amount": amount,
        "currency": "eur",
        "stripe_session_id": session.session_id,
        "status": "pending",
        "payment_status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    user = await get_current_user(request)
    
    transaction = await db.payment_transactions.find_one(
        {"stripe_session_id": session_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # If already processed, return cached status
    if transaction.get("payment_status") == "paid":
        return {"status": "complete", "payment_status": "paid", "plan_id": transaction.get("plan_id")}
    
    stripe_api_key = os.environ.get("STRIPE_API_KEY") or os.environ.get("STRIPE_SECRET_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction and user plan if paid
        if status.payment_status == "paid" and transaction.get("payment_status") != "paid":
            await db.payment_transactions.update_one(
                {"stripe_session_id": session_id},
                {"$set": {"status": status.status, "payment_status": status.payment_status}}
            )
            # Upgrade user plan
            await db.users.update_one(
                {"user_id": user["user_id"]},
                {"$set": {"plan": transaction["plan_id"]}}
            )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "plan_id": transaction.get("plan_id")
        }
    except Exception as e:
        logger.error(f"Payment status check error: {e}")
        return {"status": transaction.get("status"), "payment_status": transaction.get("payment_status")}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_api_key = os.environ.get("STRIPE_API_KEY") or os.environ.get("STRIPE_SECRET_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            transaction = await db.payment_transactions.find_one({"stripe_session_id": session_id})
            
            if transaction and transaction.get("payment_status") != "paid":
                await db.payment_transactions.update_one(
                    {"stripe_session_id": session_id},
                    {"$set": {"status": "complete", "payment_status": "paid"}}
                )
                await db.users.update_one(
                    {"user_id": transaction["user_id"]},
                    {"$set": {"plan": transaction["plan_id"]}}
                )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

# ==================== USER PROFILE ====================

@api_router.get("/user/billing")
async def get_billing(request: Request):
    user = await get_current_user(request)
    
    transactions = await db.payment_transactions.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    current_plan = PLANS.get(user.get("plan", "free"), PLANS["free"])
    
    return {
        "current_plan": {
            "id": user.get("plan", "free"),
            "name": current_plan["name"],
            "price": current_plan["price"],
            "features": current_plan["features"]
        },
        "transactions": transactions,
        "available_plans": [
            {"id": k, "name": v["name"], "price": v["price"], "features": v["features"]}
            for k, v in PLANS.items()
        ]
    }

@api_router.put("/user/profile")
async def update_profile(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    
    allowed_fields = ["name"]
    update_data = {k: v for k, v in body.items() if k in allowed_fields}
    
    if update_data:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return updated_user

# ==================== STATS ====================

@api_router.get("/user/stats")
async def get_user_stats(request: Request):
    user = await get_current_user(request)
    
    project_count = await db.projects.count_documents({"user_id": user["user_id"]})
    blueprint_count = await db.projects.count_documents({"user_id": user["user_id"], "status": "blueprint_generated"})
    
    return {
        "total_projects": project_count,
        "blueprints_generated": blueprint_count,
        "plan": user.get("plan", "free")
    }

# ==================== STARTUP ====================

@app.on_event("startup")
async def startup_event():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.projects.create_index("user_id")
    await db.projects.create_index("project_id", unique=True)
    await db.user_sessions.create_index("session_token")
    await db.user_sessions.create_index("user_id")
    await db.payment_transactions.create_index("stripe_session_id")
    await db.login_attempts.create_index("identifier")
    await db.newsletter_subscribers.create_index("email", unique=True)
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@sistemamaestro.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "plan": "premium",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user created: {admin_email}")
    
    # Write test credentials
    creds_dir = Path("/app/memory")
    creds_dir.mkdir(exist_ok=True)
    with open(creds_dir / "test_credentials.md", "w") as f:
        f.write(f"""# Test Credentials - Sistema Maestro

## Admin User
- Email: {admin_email}
- Password: {admin_password}
- Role: admin
- Plan: premium

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/refresh
- POST /api/auth/google/session

## Project Endpoints
- POST /api/projects
- GET /api/projects
- GET /api/projects/{{id}}
- POST /api/projects/{{id}}/refine
- POST /api/projects/{{id}}/blueprint
- DELETE /api/projects/{{id}}

## Payment Endpoints
- POST /api/payments/checkout
- GET /api/payments/status/{{session_id}}
- POST /api/webhook/stripe
""")
    logger.info("Test credentials written to /app/memory/test_credentials.md")

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
