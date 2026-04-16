import json
import logging
from typing import Any, Dict, Optional

import openai

from app.core.config import OPENAI_API_KEY

logger = logging.getLogger(__name__)


async def analyze_with_ai(
    input_type: str,
    input_content: str,
    url_analysis: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    if not OPENAI_API_KEY:
        return {
            "route": "improve",
            "diagnosis": {
                "summary": "Sistema de análisis no configurado. Contacta al administrador.",
                "strengths": [],
                "weaknesses": [],
                "quick_wins": [],
            },
            "refine_questions": [],
        }

    client_ai = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)

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
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=2000,
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
                "quick_wins": ["Verifica tu OPENAI_API_KEY"],
            },
            "refine_questions": [],
        }
