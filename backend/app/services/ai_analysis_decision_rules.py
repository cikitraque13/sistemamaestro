"""
ai_analysis_decision_rules.py

Reglas, pesos, precedencias y diccionarios léxicos para la
microfase algorítmica de decisión del adaptador AI analysis.

Responsabilidades:
- definir pesos iniciales para route y continuity
- definir frases y patrones de activación
- definir orden de precedencia
- definir guardrails nominales
- servir como fuente estable para signals.py y decision.py

No contiene:
- extracción de señales
- scoring ejecutable
- integración con ai_analysis.py
"""

from __future__ import annotations

from typing import Dict, Tuple

from backend.app.services.ai_analysis_common import (
    ALLOWED_CONTINUITY_PATHS,
    ALLOWED_ROUTE_VALUES,
)

# -----------------------------------------------------------------------------
# Frases base para detección semántica.
# Deben mantenerse en minúsculas y sin necesidad de puntuación especial.
# La normalización del texto se hará en signals.py.
# -----------------------------------------------------------------------------

EXISTING_OFFER_PHRASES: Tuple[str, ...] = (
    "ya vendo",
    "ya ofrezco",
    "mi oferta",
    "mis servicios",
    "oferta actual",
    "servicio actual",
    "servicios de",
    "servicio de",
    "propuesta comercial",
    "ya tengo clientes",
)

SELL_GOAL_PHRASES: Tuple[str, ...] = (
    "cerrar mas clientes",
    "vender mas",
    "mejorar como presento",
    "presentar mejor mi oferta",
    "comunicar mejor mi oferta",
    "mejorar mi oferta",
    "mejorar la presentacion de mi oferta",
    "mejorar conversion comercial",
    "aumentar cierres",
    "aumentar el cierre",
    "captar mas clientes",
    "convertir mejor la oferta",
)

IMPROVE_GOAL_PHRASES: Tuple[str, ...] = (
    "detectar fricciones",
    "fricciones de conversion",
    "diagnosticar",
    "diagnostico",
    "analizar",
    "analice",
    "evaluar",
    "evaluacion",
    "corregir",
    "mejorar estructura",
    "optimizar conversion",
    "identificar problemas",
    "auditar",
    "prioridades",
    "siguientes pasos",
    "mejoras estructurales",
)

AUTOMATE_GOAL_PHRASES: Tuple[str, ...] = (
    "automatizar",
    "automatizacion",
    "clasificacion de leads",
    "clasificar leads",
    "enviar respuestas iniciales",
    "respuestas iniciales",
    "respuestas automaticas",
    "ahorrar tiempo",
    "flujo repetitivo",
    "proceso repetitivo",
    "operativa repetitiva",
    "responder automaticamente",
    "routing automatico",
    "enrutado automatico",
)

IDEA_GOAL_PHRASES: Tuple[str, ...] = (
    "algo con ia",
    "no tengo claro",
    "no se exactamente",
    "estoy pensando",
    "todavia no tengo claro",
    "aun no tengo claro",
    "quiero crear algo",
    "quiero hacer algo",
    "no tengo definido",
)

DIAGNOSTIC_LANGUAGE_PHRASES: Tuple[str, ...] = (
    "detectar",
    "diagnosticar",
    "diagnostico",
    "analizar",
    "analice",
    "evaluar",
    "auditar",
    "fricciones",
    "problemas",
    "prioridades",
    "siguientes pasos",
)

OFFER_LANGUAGE_PHRASES: Tuple[str, ...] = (
    "oferta",
    "servicios",
    "servicio",
    "propuesta",
    "presentacion",
    "cierre de clientes",
    "cerrar clientes",
)

AUTOMATION_LANGUAGE_PHRASES: Tuple[str, ...] = (
    "automatizar",
    "automatico",
    "automaticamente",
    "clasificar",
    "enviar respuestas",
    "ahorrar tiempo",
    "operativa",
)

CONVERSION_LANGUAGE_PHRASES: Tuple[str, ...] = (
    "conversion",
    "cerrar clientes",
    "captar clientes",
    "leads",
    "cta",
)

PRESENTATION_LANGUAGE_PHRASES: Tuple[str, ...] = (
    "presentar mejor",
    "presentacion",
    "comunicar mejor",
    "explicar mejor",
    "propuesta comercial",
)

UTILITY_CLARITY_PHRASES: Tuple[str, ...] = (
    "herramienta",
    "sistema",
    "servicio",
    "oferta",
    "diagnostico",
    "clasificacion",
    "detectar",
    "auditoria",
    "analice",
    "analizar",
)

OUTPUT_FORMAT_PHRASES: Tuple[str, ...] = (
    "informe",
    "scoring",
    "checklist",
    "dashboard",
    "prioridades",
    "siguientes pasos",
    "recomendaciones",
    "salida",
    "output",
)

DEFINITION_PRESSURE_PHRASES: Tuple[str, ...] = (
    "definir",
    "concretar",
    "criterios",
    "tipos de fricciones",
    "formato de salida",
    "alcance",
    "caso de uso",
    "rol de la ia",
)

MULTILAYER_ARCHITECTURE_PHRASES: Tuple[str, ...] = (
    "varios modulos",
    "builder",
    "motor",
    "dashboard",
    "flujo",
    "rutas",
    "integraciones",
    "sistema completo",
    "arquitectura",
    "multicapas",
)

EXECUTIVE_INTENSITY_PHRASES: Tuple[str, ...] = (
    "reposicionar",
    "reconducir",
    "reestructurar negocio",
    "decision estrategica fuerte",
    "intensidad alta",
    "transformacion completa",
)

# -----------------------------------------------------------------------------
# Pesos iniciales de route.
# -----------------------------------------------------------------------------

ROUTE_SIGNAL_WEIGHTS: Dict[str, Dict[str, int]] = {
    "sell": {
        "has_existing_offer": 3,
        "goal_sell_present": 4,
        "offer_language_present": 3,
        "presentation_language_present": 2,
        "conversion_language_present": 1,
    },
    "improve": {
        "goal_improve_present": 4,
        "diagnostic_language_present": 4,
        "conversion_language_present": 2,
        "has_clear_utility": 1,
    },
    "automate": {
        "goal_automate_present": 5,
        "automation_language_present": 4,
        "implementation_pressure_present": 1,
    },
    "idea": {
        "ambiguity_high": 5,
        "goal_idea_present": 3,
        "has_clear_utility_false": 3,
        "problem_defined_false": 2,
    },
}

# -----------------------------------------------------------------------------
# Pesos iniciales de continuity.
# -----------------------------------------------------------------------------

CONTINUITY_SIGNAL_WEIGHTS: Dict[str, Dict[str, int]] = {
    "stay": {
        "ambiguity_high": 5,
        "has_clear_utility_false": 3,
        "problem_defined_false": 2,
        "output_defined_false": 1,
    },
    "blueprint": {
        "has_clear_utility": 3,
        "needs_definition_first": 4,
        "needs_output_definition": 3,
        "needs_scope_definition": 2,
    },
    "sistema": {
        "needs_multilayer_architecture": 5,
        "system_design_pressure_present": 4,
        "implementation_pressure_present": 2,
    },
    "premium": {
        "executive_intensity_high": 8,
        "system_design_pressure_present": 2,
        "needs_multilayer_architecture": 2,
        "offer_language_present": 3,
    },
}

# -----------------------------------------------------------------------------
# Precedencia y desempate.
# -----------------------------------------------------------------------------

ROUTE_PRECEDENCE_ORDER: Tuple[str, ...] = (
    "automate",
    "sell",
    "improve",
    "idea",
)

CONTINUITY_PRECEDENCE_ORDER: Tuple[str, ...] = (
    "premium",
    "sistema",
    "blueprint",
    "stay",
)

ROUTE_TIEBREAKERS: Dict[str, str] = {
    "sell_vs_improve": (
        "Si existe oferta real y el cuello de botella principal es vender mejor, "
        "presentar mejor o cerrar mas, gana sell. "
        "Si domina detectar, diagnosticar, corregir o evaluar, gana improve."
    ),
    "improve_vs_idea": (
        "Si ya existe una utilidad principal clara, gana improve. "
        "Si la utilidad sigue abierta o muy ambigua, gana idea."
    ),
    "automate_vs_improve": (
        "Si el nucleo es ahorrar trabajo operativo repetitivo, gana automate. "
        "Si el nucleo es evaluar o mejorar calidad/estructura, gana improve."
    ),
}

CONTINUITY_TIEBREAKERS: Dict[str, str] = {
    "stay_vs_blueprint": (
        "Si todavia no se sabe con claridad que utilidad concreta tendra el sistema, "
        "gana stay. Si la utilidad ya esta clara pero falta estructura, gana blueprint."
    ),
    "blueprint_vs_sistema": (
        "Si el siguiente paso es definir una pieza o estructura base, gana blueprint. "
        "Si exige coordinar varias capas, modulos o flujos, gana sistema."
    ),
    "sistema_vs_premium": (
        "Si la complejidad es sobre todo arquitectonica, gana sistema. "
        "Si la intensidad es tambien estrategica o estructural alta, gana premium."
    ),
}

# -----------------------------------------------------------------------------
# Guardrails nominales.
# -----------------------------------------------------------------------------

ROUTE_GUARDRAILS: Tuple[str, ...] = (
    "clear_utility_should_not_fall_to_idea",
    "existing_offer_sell_should_not_drift_to_improve",
    "diagnostic_cases_should_favor_improve",
    "automation_cases_should_favor_automate",
    "immature_commercial_idea_should_not_drift_to_sell",
)

CONTINUITY_GUARDRAILS: Tuple[str, ...] = (
    "blueprint_is_not_default_for_everything",
    "unclear_cases_should_favor_stay",
    "multilayer_cases_should_compete_for_sistema",
    "premium_requires_high_intensity_evidence",
    "high_intensity_offer_cases_should_compete_for_premium",
    "immature_commercial_idea_should_favor_stay",
)

# -----------------------------------------------------------------------------
# CTA por continuidad, útil para decisión trazable posterior.
# -----------------------------------------------------------------------------

CONTINUITY_DEFAULT_CTA_BY_PATH: Dict[str, str] = {
    "stay": "Seguir analizando",
    "blueprint": "Entrar en Pro",
    "sistema": "Entrar en Growth",
    "premium": "Acceder a AI Master 199",
}

# -----------------------------------------------------------------------------
# Validación defensiva mínima.
# -----------------------------------------------------------------------------

assert set(ROUTE_SIGNAL_WEIGHTS.keys()) == set(ALLOWED_ROUTE_VALUES)
assert set(CONTINUITY_SIGNAL_WEIGHTS.keys()) == set(ALLOWED_CONTINUITY_PATHS)