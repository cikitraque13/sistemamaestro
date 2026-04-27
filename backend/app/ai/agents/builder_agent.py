from __future__ import annotations

import json
from typing import Any, Dict

from openai import AsyncOpenAI

from backend.app.core.config import OPENAI_API_KEY
from backend.app.ai.schemas.builder_ai_output import (
    BuilderAIInput,
    BuilderAIOutput,
    get_builder_ai_output_contract,
)


SYSTEM_PROMPT = """
Eres el adaptador Builder AI de Sistema Maestro.

Tu función:
Convertir el input del usuario en una salida estructurada que el Builder pueda aplicar como mutación.

Arquitectura obligatoria:
- OpenAI decide la construcción.
- builder_agent.py adapta la decisión.
- builderBuildKernel.js aplica o normaliza la mutación.
- builderBuildState.js sigue siendo la fuente de verdad.
- Preview, código y estructura deben salir del mismo estado.

Reglas:
- No respondas como chat genérico.
- No hagas preguntas antes de construir.
- No menciones Piedra Angular.
- No prometas deploy, hosting ni exportación.
- No sustituyas el estado completo del Builder.
- Devuelve patches y mutaciones compatibles.
- Si hay currentBuildState, modifica lo anterior, no reinicies.
- La preview debe ser específica al input del usuario.
- El código debe representar lo que aparece en preview.
- La estructura debe coincidir con preview y código.
- assistantMessage debe ser breve.
- nextAction debe ser una mejora concreta.

Devuelve SOLO JSON válido.
"""


def _build_prompt(payload: BuilderAIInput) -> str:
    return json.dumps(
        {
            "task": "Crear BuilderAIOutput V1 para Sistema Maestro.",
            "input": payload.model_dump(),
            "outputContract": get_builder_ai_output_contract(),
            "expectedShape": {
                "intent": "Qué quiere construir el usuario.",
                "projectKind": "landing | web | app | dashboard | logo | component | unknown",
                "sector": "Sector detectado.",
                "objective": "Objetivo funcional o de negocio.",
                "tone": "Tono visual/textual.",
                "mutations": [
                    {
                        "id": "mutation_1",
                        "type": "create_or_update",
                        "target": "previewModel | codeModel | structureModel",
                        "action": "Qué debe cambiar el Builder.",
                        "reason": "Por qué se aplica.",
                        "payload": {},
                    }
                ],
                "previewModelPatch": {
                    "sections": [
                        {
                            "id": "hero",
                            "type": "hero",
                            "title": "Título visible",
                            "subtitle": "Subtítulo visible",
                            "cta": "CTA principal",
                            "items": [],
                        }
                    ]
                },
                "codeModelPatch": {
                    "language": "jsx",
                    "files": [
                        {
                            "path": "src/App.jsx",
                            "content": "Código representativo coherente con la preview",
                        }
                    ]
                },
                "structureModelPatch": {
                    "nodes": [
                        {
                            "id": "root",
                            "label": "Proyecto",
                            "type": "project",
                            "children": [],
                        }
                    ]
                },
                "assistantMessage": "Mensaje corto para el chat.",
                "nextAction": "Siguiente mejora accionable.",
                "monetizationSignal": None,
                "warnings": [],
            },
        },
        ensure_ascii=False,
    )


async def run_builder_agent(payload: BuilderAIInput) -> BuilderAIOutput:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY no está configurada en backend/.env")

    client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.35,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_prompt(payload)},
        ],
    )

    raw_content = response.choices[0].message.content or "{}"

    try:
        data: Dict[str, Any] = json.loads(raw_content)
    except json.JSONDecodeError as exc:
        raise RuntimeError("OpenAI no devolvió JSON válido para BuilderAIOutput.") from exc

    return BuilderAIOutput.model_validate(data)
