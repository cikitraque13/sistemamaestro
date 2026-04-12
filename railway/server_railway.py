from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
import openai
import stripe
import json

ROOT_DIR = Path(__file__).parent

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'sistemamaestro')]

# JWT Configuration
JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_hex(32))

# OpenAI client
def get_openai_client():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("Missing OPENAI_API_KEY in environment")
    return openai.AsyncOpenAI(api_key=api_key)

# Stripe setup
def get_stripe_key():
    key = os.environ.get("STRIPE_SECRET_KEY") or os.environ.get("STRIPE_API_KEY")
    if not key:
        raise ValueError("Missing STRIPE_SECRET_KEY in environment")
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

class ProjectCreate(BaseModel):
    input_type: str = "text"
    input_content: str

class RefineInput(BaseModel):
    answers: Dict[str, str]

class NewsletterSubscribe(BaseModel):
    email: EmailStr

class CheckoutCreate(BaseModel):
    plan_id: str
    origin_url: str

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except Exception:
        return False

def get_jwt_secret():
    return JWT_SECRET

def create_access_token(user_id: str, email: str):
    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15)
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str):
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request):
    # Try session token first (Google OAuth)
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token})
        if session:
            expires_at = session.get("expires_at")
            if expires_at:
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at)
                if expires_at > datetime.now(timezone.utc):
                    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password_hash": 0})
                    if user:
                        return user
    
    # Try JWT access token
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(access_token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
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

# Brute force protection
async def check_brute_force(identifier: str):
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        last = attempts.get("last_attempt")
        if last:
            if isinstance(last, str):
                last = datetime.fromisoformat(last)
            if datetime.now(timezone.utc) - last < timedelta(minutes=15):
                raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")
            else:
                await db.login_attempts.delete_one({"identifier": identifier})

async def record_failed_attempt(identifier: str):
    await db.login_attempts.update_one(
        {"identifier": identifier},
        {"$inc": {"count": 1}, "$set": {"last_attempt": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )

async def clear_failed_attempts(identifier: str):
    await db.login_attempts.delete_one({"identifier": identifier})

# ==================== URL ANALYSIS ====================

async def fetch_and_analyze_url(url: str) -> Dict[str, Any]:
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    parsed = urlparse(url)
    if not parsed.netloc:
        return {"success": False, "error": "URL no válida"}
    
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as http_client:
            resp = await http_client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
            
            if resp.status_code >= 400:
                return {"success": False, "error": f"No se pudo acceder a la web (código {resp.status_code})"}
            
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            # Extract content
            title = soup.title.string.strip() if soup.title and soup.title.string else "Sin título"
            meta_desc = ""
            meta_tag = soup.find("meta", attrs={"name": "description"})
            if meta_tag:
                meta_desc = meta_tag.get("content", "")
            
            h1 = [tag.get_text(strip=True) for tag in soup.find_all("h1")][:5]
            h2 = [tag.get_text(strip=True) for tag in soup.find_all("h2")][:10]
            
            paragraphs = [p.get_text(strip=True) for p in soup.find_all("p") if len(p.get_text(strip=True)) > 30][:5]
            
            ctas = []
            for a in soup.find_all("a", href=True):
                text = a.get_text(strip=True).lower()
                if any(word in text for word in ["comprar", "buy", "sign up", "registr", "empieza", "start", "contact", "demo", "free", "gratis", "prueba"]):
                    ctas.append(a.get_text(strip=True))
            for btn in soup.find_all("button"):
                text = btn.get_text(strip=True)
                if text:
                    ctas.append(text)
            ctas = list(set(ctas))[:10]
            
            forms = len(soup.find_all("form"))
            nav_items = [a.get_text(strip=True) for a in soup.find_all("nav")][:5]
            
            return {
                "success": True,
                "content": {
                    "url": url,
                    "domain": parsed.netloc,
                    "title": title,
                    "meta_description": meta_desc,
                    "h1": h1,
                    "h2": h2,
                    "main_text": paragraphs,
                    "ctas": ctas,
                    "forms_count": forms,
                    "navigation": nav_items
                }
            }
    except httpx.TimeoutException:
        return {"success": False, "error": "Tiempo de espera agotado al acceder a la URL"}
    except httpx.ConnectError:
        return {"success": False, "error": "No se pudo conectar con el servidor"}
    except Exception as e:
        return {"success": False, "error": f"Error al analizar la URL: {str(e)}"}

# ==================== AI ANALYSIS (OpenAI direct) ====================

async def analyze_with_ai(input_type: str, input_content: str, url_analysis: Optional[Dict] = None) -> Dict[str, Any]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return {
            "route": "improve",
            "diagnosis": {"summary": "Sistema de análisis no configurado. Contacta al administrador.", "strengths": [], "weaknesses": [], "quick_wins": []},
            "refine_questions": []
        }
    
    client_ai = openai.AsyncOpenAI(api_key=api_key)
    
    route_names = {
        "improve": "Mejorar algo existente",
        "sell": "Vender y cobrar",
        "automate": "Automatizar operación",
        "idea": "Idea a proyecto"
    }
    
    system_prompt = """Eres el motor de análisis de Sistema Maestro, una plataforma de transformación digital.

Tu trabajo es analizar la entrada del usuario y devolver un JSON con esta estructura exacta:
{
  "route": "improve|sell|automate|idea",
  "diagnosis": {
    "summary": "Resumen del diagnóstico",
    "strengths": ["Fortaleza 1", "Fortaleza 2"],
    "weaknesses": ["Debilidad 1", "Debilidad 2"],
    "quick_wins": ["Acción rápida 1", "Acción rápida 2"]
  },
  "refine_questions": [
    {"id": "q1", "question": "Pregunta 1"},
    {"id": "q2", "question": "Pregunta 2"},
    {"id": "q3", "question": "Pregunta 3"}
  ]
}

Reglas:
- Responde SOLO con JSON válido, sin markdown
- Selecciona la ruta más adecuada automáticamente
- Sé directo, profesional y específico
- El diagnóstico debe sentirse personalizado, no genérico
- Máximo 3 preguntas de afinado
- Si es una URL, analiza el contenido real que te proporciono"""

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

FORMULARIOS: {content['forms_count']}

Proporciona un diagnóstico detallado basado en este contenido real."""
    else:
        user_prompt = f"El usuario describe su necesidad o idea:\n\n{input_content}\n\nAnaliza y proporciona diagnóstico detallado."
    
    try:
        response = await client_ai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        response_text = response.choices[0].message.content.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        return json.loads(response_text.strip())
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        return {
            "route": "idea",
            "diagnosis": {
                "summary": "No se pudo completar el análisis automático. Revisa tu configuración de OpenAI.",
                "strengths": [],
                "weaknesses": [],
                "quick_wins": ["Verifica tu OPENAI_API_KEY"]
            },
            "refine_questions": []
        }

async def generate_blueprint(project: Dict) -> Dict:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return {
            "title": "Blueprint no disponible",
            "summary": "Configura OPENAI_API_KEY para generar blueprints",
            "priorities": ["Configurar API key de OpenAI"],
            "architecture": {"components": ["Por definir"]},
            "monetization": "Por definir",
            "deployment_steps": ["Configurar entorno"],
            "timeline_estimate": "Por definir"
        }
    
    client_ai = openai.AsyncOpenAI(api_key=api_key)
    
    route_names = {
        "improve": "Mejorar algo existente",
        "sell": "Vender y cobrar",
        "automate": "Automatizar operación",
        "idea": "Idea a proyecto"
    }
    
    system_prompt = """Eres el arquitecto de Sistema Maestro. Genera un Blueprint (plan de acción) en JSON exacto:
{
    "title": "Título del blueprint",
    "summary": "Resumen ejecutivo del plan",
    "priorities": ["Prioridad 1", "Prioridad 2", "Prioridad 3"],
    "architecture": {
        "components": ["Componente 1", "Componente 2"],
        "tech_stack": ["Tecnología 1", "Tecnología 2"]
    },
    "monetization": "Estrategia de monetización recomendada",
    "deployment_steps": ["Paso 1", "Paso 2", "Paso 3", "Paso 4"],
    "timeline_estimate": "Estimación temporal",
    "key_metrics": ["Métrica 1 a seguir", "Métrica 2 a seguir"]
}

Sé específico y práctico. Evita generalidades."""

    context = f"""
Ruta: {route_names.get(project.get('route', ''), 'General')}
Entrada original: {project.get('input_content', '')}
Diagnóstico: {project.get('diagnosis', {})}
Respuestas de afinado: {project.get('refine_answers', {})}
Análisis de URL: {project.get('url_analysis', 'N/A')}
"""
    
    try:
        response = await client_ai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": context}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        response_text = response.choices[0].message.content.strip()
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
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="lax", max_age=604800, path="/")
    
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
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="lax", max_age=604800, path="/")
    
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
async def refresh_token_endpoint(request: Request, response: Response):
    refresh_tok = request.cookies.get("refresh_token")
    if not refresh_tok:
        raise HTTPException(status_code=401, detail="No refresh token")
    
    try:
        payload = jwt.decode(refresh_tok, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        new_access_token = create_access_token(user["user_id"], user["email"])
        response.set_cookie(key="access_token", value=new_access_token, httponly=True, secure=True, samesite="lax", max_age=900, path="/")
        
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ==================== GOOGLE OAUTH (Direct Google) ====================
# NOTE: For Railway deployment, configure Google OAuth directly
# Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in env vars
# The frontend will redirect to Google directly

@api_router.post("/auth/google/session")
async def google_session(request: Request, response: Response):
    body = await request.json()
    
    # Support both Emergent Auth and direct Google token
    session_id = body.get("session_id")
    google_token = body.get("credential")
    
    google_data = None
    
    if google_token:
        # Direct Google OAuth - verify token
        async with httpx.AsyncClient() as http_client:
            resp = await http_client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={google_token}")
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google token")
            google_data = resp.json()
            google_data["name"] = google_data.get("name", google_data.get("given_name", "User"))
    elif session_id:
        # Emergent Auth fallback
        async with httpx.AsyncClient() as http_client:
            resp = await http_client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            google_data = resp.json()
    else:
        raise HTTPException(status_code=400, detail="Missing authentication data")
    
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
            "google_id": google_data.get("id") or google_data.get("sub"),
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
    
    url_analysis = None
    if project_data.input_type == "url":
        url_analysis = await fetch_and_analyze_url(project_data.input_content)
        if not url_analysis.get("success"):
            raise HTTPException(
                status_code=400,
                detail=url_analysis.get("error", "No se pudo analizar la URL")
            )
    
    analysis = await analyze_with_ai(
        project_data.input_type,
        project_data.input_content,
        url_analysis
    )
    
    project_id = f"proj_{uuid.uuid4().hex[:12]}"
    project_doc = {
        "project_id": project_id,
        "user_id": user["user_id"],
        "input_type": project_data.input_type,
        "input_content": project_data.input_content,
        "route": analysis.get("route", "idea"),
        "diagnosis": analysis.get("diagnosis", {}),
        "refine_questions": analysis.get("refine_questions", []),
        "url_analysis": url_analysis.get("content") if url_analysis and url_analysis.get("success") else None,
        "status": "analyzed",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.projects.insert_one(project_doc)
    project_doc.pop("_id", None)
    return project_doc

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

@api_router.post("/projects/{project_id}/refine")
async def refine_project(project_id: str, refine_data: RefineInput, request: Request):
    user = await get_current_user(request)
    project = await db.projects.find_one(
        {"project_id": project_id, "user_id": user["user_id"]}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {
            "refine_answers": refine_data.answers,
            "status": "refined",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    return updated

@api_router.post("/projects/{project_id}/blueprint")
async def create_blueprint(project_id: str, request: Request):
    user = await get_current_user(request)
    
    if user.get("plan") == "free" and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Upgrade to Blueprint plan to unlock this feature")
    
    project = await db.projects.find_one(
        {"project_id": project_id, "user_id": user["user_id"]}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    blueprint = await generate_blueprint(project)
    
    await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {
            "blueprint": blueprint,
            "status": "blueprint_generated",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    return updated

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.projects.delete_one(
        {"project_id": project_id, "user_id": user["user_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Proyecto eliminado"}

# ==================== OPPORTUNITIES ====================

OPPORTUNITIES = [
    {
        "opportunity_id": "opp_001",
        "title": "Micro-SaaS de Automatización de Emails",
        "description": "Herramienta que automatiza respuestas de email para freelancers y pequeños negocios",
        "business_model": "SaaS con tiers: Free (50 emails/mes), Pro ($29/mes), Business ($79/mes)",
        "monetization": "Suscripción mensual + servicios de setup",
        "difficulty": "media",
        "route": "automate",
        "steps": [
            "Validar demanda con landing page + lista de espera",
            "Crear MVP con integración Gmail/Outlook",
            "Lanzar beta con 10 usuarios piloto",
            "Iterar según feedback y métricas",
            "Escalar con marketing de contenidos y SEO"
        ]
    },
    {
        "opportunity_id": "opp_002",
        "title": "Directorio de Nichos Específicos",
        "description": "Directorio curado para un nicho específico (ej: agencias de marketing, estudios de tatuaje)",
        "business_model": "Freemium: Listado básico gratis, Premium ($15/mes) con destacados y analytics",
        "monetization": "Listados premium + publicidad segmentada",
        "difficulty": "facil",
        "route": "idea",
        "steps": [
            "Elegir nicho con demanda verificada",
            "Scrapear datos iniciales para llenar el directorio",
            "Lanzar con SEO local optimizado",
            "Contactar negocios para upgrades premium",
            "Monetizar con featured listings y banners"
        ]
    },
    {
        "opportunity_id": "opp_003",
        "title": "Kit de Plantillas para Notion/Airtable",
        "description": "Colección de plantillas profesionales para gestión de proyectos",
        "business_model": "Producto digital: Pack básico ($29), Pack avanzado ($79), Pack empresa ($199)",
        "monetization": "Venta directa + bundles + actualizaciones premium",
        "difficulty": "facil",
        "route": "sell",
        "steps": [
            "Crear 5 plantillas core de alta calidad",
            "Montar tienda en Gumroad o LemonSqueezy",
            "Crear contenido demo en YouTube/TikTok",
            "Lanzar con descuento de early adopter",
            "Expandir con plantillas por industria"
        ]
    },
    {
        "opportunity_id": "opp_004",
        "title": "Auditoría Web Automatizada",
        "description": "Servicio que analiza sitios web y genera reportes de mejora automáticos",
        "business_model": "Freemium: Análisis básico gratis, Reporte completo ($49), Consultoría ($299)",
        "monetization": "Pay-per-report + suscripción mensual para agencias",
        "difficulty": "avanzada",
        "route": "improve",
        "steps": [
            "Desarrollar motor de análisis con Lighthouse + custom checks",
            "Crear generador de reportes PDF profesionales",
            "Lanzar versión gratuita para captar leads",
            "Vender reportes premium con recomendaciones detalladas",
            "Ofrecer servicio de implementación para empresas"
        ]
    },
    {
        "opportunity_id": "opp_005",
        "title": "Comunidad de Pago por Nicho",
        "description": "Comunidad privada con contenido exclusivo y networking",
        "business_model": "Suscripción: $29/mes o $249/año",
        "monetization": "Membresía recurrente + eventos premium + sponsors",
        "difficulty": "media",
        "route": "sell",
        "steps": [
            "Definir nicho y propuesta de valor única",
            "Crear contenido fundacional (10 recursos core)",
            "Lanzar con invitación limitada (50 miembros founding)",
            "Establecer rutinas: weekly calls, AMAs, resources",
            "Escalar con referral program y content marketing"
        ]
    }
]

@api_router.get("/opportunities")
async def get_opportunities(request: Request):
    user = await get_current_user(request)
    
    plan = user.get("plan", "free")
    role = user.get("role", "user")
    
    if plan == "free" and role != "admin":
        has_opportunities = "opportunities" in PLANS.get(plan, {}).get("features", [])
        if not has_opportunities:
            return OPPORTUNITIES[:2]
    
    return OPPORTUNITIES

@api_router.get("/opportunities/{opportunity_id}")
async def get_opportunity(opportunity_id: str, request: Request):
    user = await get_current_user(request)
    
    plan = user.get("plan", "free")
    role = user.get("role", "user")
    
    opp = next((o for o in OPPORTUNITIES if o["opportunity_id"] == opportunity_id), None)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    if plan == "free" and role != "admin":
        allowed = OPPORTUNITIES[:2]
        if opp not in allowed:
            raise HTTPException(status_code=403, detail="Upgrade to access more opportunities")
    
    return opp

# ==================== PAYMENTS (Stripe direct) ====================

@api_router.post("/payments/checkout")
async def create_checkout(checkout_data: CheckoutCreate, request: Request):
    user = await get_current_user(request)
    
    if checkout_data.plan_id not in PLANS or checkout_data.plan_id == "free":
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    plan = PLANS[checkout_data.plan_id]
    amount = int(plan["price"] * 100)  # cents
    
    stripe_key = get_stripe_key()
    stripe.api_key = stripe_key
    
    host_url = checkout_data.origin_url.rstrip("/")
    success_url = f"{host_url}/dashboard/billing?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/dashboard/billing"
    
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": f"Sistema Maestro - Plan {plan['name']}",
                        "description": f"Acceso al plan {plan['name']}"
                    },
                    "unit_amount": amount
                },
                "quantity": 1
            }],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": user["user_id"],
                "plan_id": checkout_data.plan_id,
                "user_email": user["email"]
            }
        )
        
        await db.payment_transactions.insert_one({
            "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
            "user_id": user["user_id"],
            "user_email": user["email"],
            "plan_id": checkout_data.plan_id,
            "amount": plan["price"],
            "currency": "eur",
            "stripe_session_id": session.id,
            "status": "pending",
            "payment_status": "initiated",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {"url": session.url, "session_id": session.id}
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail="Error al crear sesión de pago")

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    user = await get_current_user(request)
    
    transaction = await db.payment_transactions.find_one(
        {"stripe_session_id": session_id, "user_id": user["user_id"]},
        {"_id": 0}
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction.get("payment_status") == "paid":
        return {"status": "complete", "payment_status": "paid", "plan_id": transaction.get("plan_id")}
    
    stripe_key = get_stripe_key()
    stripe.api_key = stripe_key
    
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status == "paid" and transaction.get("payment_status") != "paid":
            await db.payment_transactions.update_one(
                {"stripe_session_id": session_id},
                {"$set": {"status": "complete", "payment_status": "paid"}}
            )
            await db.users.update_one(
                {"user_id": user["user_id"]},
                {"$set": {"plan": transaction["plan_id"]}}
            )
        
        return {
            "status": session.status,
            "payment_status": session.payment_status,
            "plan_id": transaction.get("plan_id")
        }
    except Exception as e:
        logger.error(f"Payment status check error: {e}")
        return {"status": transaction.get("status"), "payment_status": transaction.get("payment_status")}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    
    try:
        if webhook_secret and signature:
            event = stripe.Webhook.construct_event(body, signature, webhook_secret)
        else:
            event = json.loads(body)
        
        if event.get("type") == "checkout.session.completed":
            session = event["data"]["object"]
            session_id = session["id"]
            
            if session.get("payment_status") == "paid":
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
    
    logger.info("Sistema Maestro started successfully")

# Include router
app.include_router(api_router)

# Public healthcheck for Railway
@app.get("/health")
async def health():
    return {"status": "ok"}

# CORS - configure for your domain in production
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != ["*"] else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve React frontend static files
STATIC_DIR = ROOT_DIR / "frontend" / "build"
if STATIC_DIR.exists():
    static_assets_dir = STATIC_DIR / "static"
    if static_assets_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_assets_dir)), name="static")

    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        """Serve React app for all non-API routes"""
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"))

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
