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
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "sistemamaestro")]

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

# Google config
def get_google_client_id():
    return os.environ.get("REACT_APP_GOOGLE_CLIENT_ID") or os.environ.get("GOOGLE_CLIENT_ID") or ""

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
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
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
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
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

def normalize_datetime(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value)
        except ValueError:
            return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
    return None

def should_use_secure_cookies(request: Optional[Request] = None) -> bool:
    explicit = os.environ.get("COOKIE_SECURE")
    if explicit is not None:
        return explicit.strip().lower() in {"1", "true", "yes", "on"}

    if os.environ.get("RAILWAY_PUBLIC_DOMAIN") or os.environ.get("RAILWAY_ENVIRONMENT_NAME") == "production":
        return True

    if request is not None:
        return request.url.scheme == "https"

    return False

def set_auth_cookies(response: Response, access_token: str, refresh_token: str, request: Optional[Request] = None):
    secure = should_use_secure_cookies(request)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=900,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=604800,
        path="/"
    )

def clear_auth_cookies(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    response.delete_cookie(key="session_token", path="/")

async def get_current_user(request: Request):
    # Try Google session token first
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token})
        if session:
            expires_at = normalize_datetime(session.get("expires_at"))
            if expires_at and expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one(
                    {"user_id": session["user_id"]},
                    {"_id": 0, "password_hash": 0}
                )
                if user:
                    return user

    # Try JWT access token
    access_token = request.cookies.get("access_token")
    if not access_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            access_token = auth_header[7:]

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
        last = normalize_datetime(attempts.get("last_attempt"))
        if last and datetime.now(timezone.utc) - last < timedelta(minutes=15):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")
        await db.login_attempts.delete_one({"identifier": identifier})

async def record_failed_attempt(identifier: str):
    await db.login_attempts.update_one(
        {"identifier": identifier},
        {
            "$inc": {"count": 1},
            "$set": {"last_attempt": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )

async def clear_failed_attempts(identifier: str):
    await db.login_attempts.delete_one({"identifier": identifier})

# ==================== URL ANALYSIS ====================

async def fetch_and_analyze_url(url: str) -> Dict[str, Any]:
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    parsed = urlparse(url)
    if not parsed.netloc:
        return {"success": False, "error": "URL no válida"}

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as http_client:
            resp = await http_client.get(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            )

            if resp.status_code >= 400:
                return {"success": False, "error": f"No se pudo acceder a la web (código {resp.status_code})"}

            soup = BeautifulSoup(resp.text, "html.parser")

            title = soup.title.string.strip() if soup.title and soup.title.string else "Sin título"
            meta_desc = ""
            meta_tag = soup.find("meta", attrs={"name": "description"})
            if meta_tag:
                meta_desc = meta_tag.get("content", "")

            h1 = [tag.get_text(strip=True) for tag in soup.find_all("h1")][:5]
            h2 = [tag.get_text(strip=True) for tag in soup.find_all("h2")][:10]

            paragraphs = [
                p.get_text(strip=True)
                for p in soup.find_all("p")
                if len(p.get_text(strip=True)) > 30
            ][:5]

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

    system_prompt = """Eres el motor de análisis de Sistema Maestro, una plataforma de transformación digital.

Piensas internamente con cuatro lentes:
1. CRO / conversión
2. Monetización / growth
3. Product strategy / priorización
4. IA aplicada / automatización

Tu trabajo es detectar cuellos de botella que afecten claridad, captación, conversión, confianza, monetización o escalabilidad.

Debes devolver SOLO un JSON válido con esta estructura exacta:
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
- El resumen debe identificar el cuello de botella principal y por qué importa comercialmente
- No prometas resultados garantizados ni cifras inventadas
- strengths = activos reales ya aprovechables
- weaknesses = fricciones concretas que hoy limitan captación, conversión, autoridad o monetización
- quick_wins = acciones concretas, de alto impacto y relativamente rápidas
- refine_questions = preguntas que reduzcan ambigüedad y mejoren precisión
- Máximo 3 preguntas de afinado
- Si es una URL, analiza el contenido real proporcionado y no inventes elementos no visibles"""

    if input_type == "url" and url_analysis and url_analysis.get("content"):
        content = url_analysis["content"]
        user_prompt = f"""Analiza esta web existente desde estas perspectivas:
- claridad de propuesta de valor
- captación y CTA
- conversión y fricción
- confianza y autoridad
- monetización visible
- estructura comercial
- SEO visible y señales técnicas detectables
- oportunidades de automatización o IA si aplica

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

NAVEGACIÓN: {', '.join(content['navigation']) if content['navigation'] else 'No encontrada'}

Proporciona un diagnóstico comercial y estratégico basado SOLO en este contenido real."""
    else:
        user_prompt = f"""El usuario describe una idea, necesidad o problema digital.

Analiza el caso con enfoque en:
- claridad del negocio o propuesta
- captación y conversión
- monetización
- cuellos de botella
- estructura y priorización
- oportunidades rápidas de mejora
- posibles palancas de automatización o IA

Entrada del usuario:
{input_content}

Devuelve un diagnóstico específico y útil, evitando generalidades."""

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

def clamp_score(value: int) -> int:
    return max(0, min(4, value))

def keyword_hits(text: str, keywords: List[str]) -> int:
    lowered = (text or "").lower()
    return sum(1 for kw in keywords if kw in lowered)

def build_plan_recommendation(
    input_type: str,
    input_content: str,
    analysis: Dict[str, Any],
    url_analysis: Optional[Dict[str, Any]] = None,
    refine_answers: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    route = analysis.get("route", "idea")
    diagnosis = analysis.get("diagnosis") or {}
    refine_questions = analysis.get("refine_questions") or []
    refine_answers = refine_answers or {}

    url_content = {}
    if isinstance(url_analysis, dict):
        url_content = url_analysis.get("content", url_analysis)

    summary = diagnosis.get("summary", "")
    strengths = diagnosis.get("strengths") or []
    weaknesses = diagnosis.get("weaknesses") or []
    quick_wins = diagnosis.get("quick_wins") or []

    answers_text = " ".join(
        str(v) for v in refine_answers.values() if isinstance(v, (str, int, float))
    )

    combined_text = " ".join([
        str(input_content or ""),
        str(summary or ""),
        " ".join(str(x) for x in strengths),
        " ".join(str(x) for x in weaknesses),
        " ".join(str(x) for x in quick_wins),
        answers_text
    ])

    conversion_keywords = [
        "convers", "cta", "capt", "lead", "ventas", "checkout", "precio",
        "pricing", "embudo", "funnel", "formular", "contact", "reserva"
    ]
    money_keywords = [
        "monet", "ingres", "ticket", "suscrip", "upsell", "retención",
        "margen", "beneficio", "facturación", "ventas"
    ]
    urgency_keywords = [
        "urg", "bloque", "caída", "perdiendo", "fricción", "abandono",
        "lento", "carga", "ya", "inmediato"
    ]
    continuity_keywords = [
        "escala", "automat", "continu", "roadmap", "sistema",
        "evolu", "iter", "crecim", "equipo"
    ]

    cta_count = len(url_content.get("ctas", []) or [])
    h2_count = len(url_content.get("h2", []) or [])
    forms_count = int(url_content.get("forms_count", 0) or 0)

    complexity = {
        "idea": 1,
        "improve": 2,
        "sell": 2,
        "automate": 3
    }.get(route, 1)

    if len(weaknesses) >= 3:
        complexity += 1
    if input_type == "url" and (forms_count > 0 or cta_count >= 3 or h2_count >= 5):
        complexity += 1
    if len(refine_answers) >= 2:
        complexity += 1
    complexity = clamp_score(complexity)

    economic_impact = {
        "idea": 1,
        "improve": 2,
        "sell": 3,
        "automate": 2
    }.get(route, 1)

    if keyword_hits(combined_text, conversion_keywords) >= 2:
        economic_impact += 1
    if keyword_hits(combined_text, money_keywords) >= 2:
        economic_impact += 1
    if input_type == "url" and (forms_count > 0 or cta_count >= 2):
        economic_impact += 1
    economic_impact = clamp_score(economic_impact)

    urgency = {
        "idea": 0,
        "improve": 1,
        "sell": 1,
        "automate": 1
    }.get(route, 0)

    if keyword_hits(combined_text, urgency_keywords) >= 1:
        urgency += 1
    if len(weaknesses) >= 4:
        urgency += 1
    if input_type == "url" and cta_count == 0 and forms_count == 0:
        urgency += 1
    urgency = clamp_score(urgency)

    structure_need = {
        "idea": 1,
        "improve": 2,
        "sell": 2,
        "automate": 3
    }.get(route, 1)

    if len(quick_wins) >= 2 and len(weaknesses) >= 2:
        structure_need += 1
    if len(refine_questions) >= 2 or len(refine_answers) >= 2:
        structure_need += 1
    structure_need = clamp_score(structure_need)

    continuity_need = {
        "idea": 1,
        "improve": 1,
        "sell": 2,
        "automate": 2
    }.get(route, 1)

    if input_type == "url":
        continuity_need += 1
    if keyword_hits(combined_text, continuity_keywords) >= 1:
        continuity_need += 1
    if len(refine_answers) >= 2:
        continuity_need += 1
    continuity_need = clamp_score(continuity_need)

    score_total = complexity + economic_impact + urgency + structure_need + continuity_need

    if score_total <= 7:
        recommended_plan = "blueprint"
    elif score_total <= 13:
        recommended_plan = "sistema"
    else:
        if complexity >= 3 and (structure_need >= 3 or continuity_need >= 3):
            recommended_plan = "premium"
        else:
            recommended_plan = "sistema"

    if recommended_plan == "blueprint":
        reason = (
            "Tu caso todavía encaja en una fase de diagnóstico afinado. "
            "El siguiente cuello de botella no es la complejidad del sistema, "
            "sino precisar mejor el problema real y priorizar quick wins."
        )
        why_not_lower = (
            "La capa gratuita ayuda a detectar señales iniciales, "
            "pero aquí ya conviene afinar el diagnóstico y ordenar mejor el foco."
        )
        unlocks = "Más precisión, prioridad inicial y una primera dirección accionable."
        cta_label = "Afinar diagnóstico"
    elif recommended_plan == "sistema":
        reason = (
            "Tu caso ya supera una mejora puntual. "
            "Aquí el verdadero cuello de botella ya no es detectar el problema, "
            "sino ordenar qué tocar primero, con qué prioridad y con qué lógica de ejecución."
        )
        why_not_lower = (
            "Un diagnóstico afinado se quedaría corto porque aquí ya no basta con detectar fallos; "
            "hace falta priorizar y estructurar."
        )
        unlocks = "Prioridades, arquitectura y plan accionable para ejecutar con criterio."
        cta_label = "Convertir esto en un plan accionable"
    else:
        reason = (
            "Aquí ya no hablamos solo de corregir un bloque aislado. "
            "El caso presenta varios frentes con impacto comercial, de conversión o de sistema, "
            "y necesita una capa superior de profundidad estratégica."
        )
        why_not_lower = (
            "Un blueprint básico ayudaría, pero aquí hay suficiente complejidad e impacto "
            "como para necesitar una intervención más profunda."
        )
        unlocks = "Profundidad estratégica, continuidad y una intervención más completa."
        cta_label = "Activar intervención estratégica completa"

    plan_data = PLANS[recommended_plan]

    return {
        "recommended_plan_id": recommended_plan,
        "recommended_plan_name": plan_data["name"],
        "recommended_plan_price": plan_data["price"],
        "score_total": score_total,
        "scores": {
            "complexity": complexity,
            "economic_impact": economic_impact,
            "urgency": urgency,
            "structure_need": structure_need,
            "continuity_need": continuity_need
        },
        "reason": reason,
        "why_not_lower": why_not_lower,
        "unlocks": unlocks,
        "cta_label": cta_label,
        "version": "v1"
    }

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate, request: Request, response: Response):
    email = user_data.email.lower().strip()
    name = user_data.name.strip() if user_data.name else "User"
    password = user_data.password

    existing = await db.users.find_one({"email": email}, {"_id": 0})

    if existing:
        # Si la cuenta existe pero venía de Google y no tiene password_hash,
        # permitimos completar acceso por contraseña con el mismo email.
        if not existing.get("password_hash"):
            await db.users.update_one(
                {"user_id": existing["user_id"]},
                {
                    "$set": {
                        "password_hash": hash_password(password),
                        "name": name or existing.get("name", "User"),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )

            updated_user = await db.users.find_one({"user_id": existing["user_id"]}, {"_id": 0})
            access_token = create_access_token(updated_user["user_id"], updated_user["email"])
            refresh_token = create_refresh_token(updated_user["user_id"])
            set_auth_cookies(response, access_token, refresh_token, request)

            updated_user.pop("password_hash", None)
            return updated_user

        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": email,
        "password_hash": hash_password(password),
        "name": name or "User",
        "role": "user",
        "plan": "free",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)

    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token, request)

    return {
        "user_id": user_id,
        "email": email,
        "name": name or "User",
        "role": "user",
        "plan": "free"
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin, request: Request, response: Response):
    email = user_data.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    await check_brute_force(identifier)

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        await record_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.get("password_hash"):
        raise HTTPException(
            status_code=400,
            detail="Esta cuenta usa acceso con Google. Continúa con Google o crea una contraseña desde registro."
        )

    if not verify_password(user_data.password, user.get("password_hash", "")):
        await record_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    await clear_failed_attempts(identifier)

    access_token = create_access_token(user["user_id"], email)
    refresh_token = create_refresh_token(user["user_id"])
    set_auth_cookies(response, access_token, refresh_token, request)

    user.pop("password_hash", None)
    return user

@api_router.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
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
        secure = should_use_secure_cookies(request)
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            httponly=True,
            secure=secure,
            samesite="lax",
            max_age=900,
            path="/"
        )

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
    google_token = body.get("credential")

    google_data = None

    if google_token:
        expected_client_id = get_google_client_id()

        async with httpx.AsyncClient() as http_client:
            resp = await http_client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={google_token}"
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google token")

            google_data = resp.json()

        if expected_client_id and google_data.get("aud") != expected_client_id:
            raise HTTPException(status_code=401, detail="Invalid Google token")

        google_data["name"] = google_data.get("name", google_data.get("given_name", "User"))

    elif session_id:
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

    email = (google_data.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    existing_user = await db.users.find_one({"email": email}, {"_id": 0})

    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "name": google_data.get("name", existing_user.get("name", "User")),
                    "picture": google_data.get("picture"),
                    "google_id": google_data.get("id") or google_data.get("sub") or existing_user.get("google_id"),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
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

    secure = should_use_secure_cookies(request)
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=secure,
        samesite="lax",
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

    plan_recommendation = build_plan_recommendation(
        input_type=project_data.input_type,
        input_content=project_data.input_content,
        analysis=analysis,
        url_analysis=url_analysis
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
        "plan_recommendation": plan_recommendation,
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

    analysis_for_recommendation = {
        "route": project.get("route", "idea"),
        "diagnosis": project.get("diagnosis", {}),
        "refine_questions": project.get("refine_questions", [])
    }

    plan_recommendation = build_plan_recommendation(
        input_type=project.get("input_type", "text"),
        input_content=project.get("input_content", ""),
        analysis=analysis_for_recommendation,
        url_analysis=project.get("url_analysis"),
        refine_answers=refine_data.answers
    )

    await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {
            "refine_answers": refine_data.answers,
            "plan_recommendation": plan_recommendation,
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
    amount = int(plan["price"] * 100)

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

@api_router.get("/public/config")
async def get_public_config():
    return {
        "google_client_id": get_google_client_id()
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

# Public healthcheck for Railway
@app.get("/health")
async def health():
    return {"status": "ok"}

# Include router
app.include_router(api_router)

# CORS
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != ["*"] else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve React frontend static files from Railway build output
FRONTEND_BUILD_DIR = ROOT_DIR / "frontend" / "build"
FRONTEND_STATIC_DIR = FRONTEND_BUILD_DIR / "static"

if FRONTEND_STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_STATIC_DIR)), name="static")

@app.get("/", include_in_schema=False)
async def serve_root():
    index_file = FRONTEND_BUILD_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"detail": "Frontend build not found"}

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_react(full_path: str):
    if full_path.startswith("api") or full_path in {"docs", "redoc", "openapi.json", "health"}:
        raise HTTPException(status_code=404, detail="Not Found")

    requested_file = FRONTEND_BUILD_DIR / full_path
    if requested_file.exists() and requested_file.is_file():
        return FileResponse(str(requested_file))

    index_file = FRONTEND_BUILD_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))

    return {"detail": "Frontend build not found"}

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
