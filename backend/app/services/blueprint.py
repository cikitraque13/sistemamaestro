import json
import logging
from typing import Dict

import openai

from backend.app.core.config import OPENAI_API_KEY

logger = logging.getLogger(__name__)


async def generate_blueprint(project: Dict) -> Dict:
    if not OPENAI_API_KEY:
        return {
            "title": "Blueprint no disponible",
            "summary": "Configura OPENAI_API_KEY para generar blueprints",
            "priorities": ["Configurar API key de OpenAI"],
            "architecture": {"components": ["Por definir"]},
            "monetization": "Por definir",
            "deployment_steps": ["Configurar entorno"],
            "timeline_estimate": "Por definir"
        }

    client_ai = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)

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
