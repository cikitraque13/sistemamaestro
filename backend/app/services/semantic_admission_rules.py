"""
semantic_admission_rules.py

Reglas, taxonomias, pesos, precedencias, guardrails y plantillas
para la Capa de Admision Semantica v1.

Responsabilidades:
- definir taxonomias canonicas
- definir frases/senales base
- definir pesos iniciales
- definir precedencias y umbrales
- definir guardrails nominales
- definir plantillas de pregunta unica

No contiene:
- normalizacion de texto
- extraccion de senales ejecutable
- scoring runtime
- integracion con ai_analysis.py
"""

from __future__ import annotations

from typing import Dict, Tuple

# -----------------------------------------------------------------------------
# Taxonomias canonicas
# -----------------------------------------------------------------------------

ALLOWED_INPUT_MODES: Tuple[str, ...] = (
    "text",
    "pasted_text",
    "voice_transcript",
)

ALLOWED_INPUT_NATURES: Tuple[str, ...] = (
    "product_description",
    "service_offer",
    "system_concept",
    "automation_flow",
    "audit_request",
    "idea_validation",
    "mixed_input",
)

ALLOWED_USER_INTENTS: Tuple[str, ...] = (
    "sell_this",
    "position_this",
    "validate_this",
    "improve_this",
    "build_this",
    "automate_this",
    "diagnose_this",
    "unclear",
)

ALLOWED_MATURITY_LEVELS: Tuple[str, ...] = (
    "existing_offer",
    "defined_solution",
    "concept_in_definition",
    "early_idea",
)

ALLOWED_CONFIDENCE_LEVELS: Tuple[str, ...] = (
    "high",
    "medium",
    "low",
)

# -----------------------------------------------------------------------------
# Metadatos y thresholds
# -----------------------------------------------------------------------------

HIGH_CONFIDENCE_DELTA = 4
MEDIUM_CONFIDENCE_DELTA = 2
LOW_CONFIDENCE_MAX_DELTA = 1

MAX_TEXT_CLARIFICATION_WORDS = 30
MAX_VOICE_CLARIFICATION_WORDS = 20

# -----------------------------------------------------------------------------
# Frases auxiliares de normalizacion / voz
# -----------------------------------------------------------------------------

VOICE_FILLER_PHRASES: Tuple[str, ...] = (
    "eh",
    "mmm",
    "o sea",
    "osea",
    "en plan",
    "bueno",
    "a ver",
    "vale",
    "pues",
    "digamos",
)

VOICE_SELF_CORRECTION_PHRASES: Tuple[str, ...] = (
    "mejor dicho",
    "o mejor",
    "bueno no",
    "quiero decir",
    "mas bien",
)

VOICE_FRAGMENT_HINTS: Tuple[str, ...] = (
    "seria como",
    "la idea seria",
    "algo que haga",
    "imaginate",
    "y luego ademas",
    "no se exactamente",
)

# -----------------------------------------------------------------------------
# Senales base — comercializacion / oferta
# -----------------------------------------------------------------------------

EXISTING_OFFER_SIGNAL_PHRASES: Tuple[str, ...] = (
    "ya vendo",
    "ya ofrezco",
    "mi oferta",
    "nuestro servicio",
    "mi servicio",
    "mis servicios",
    "oferta actual",
    "servicio actual",
    "ya tengo clientes",
    "ya lo estamos vendiendo",
)

OFFER_LANGUAGE_SIGNAL_PHRASES: Tuple[str, ...] = (
    "oferta",
    "servicio",
    "servicios",
    "programa",
    "mentoring",
    "solucion",
    "propuesta",
    "producto",
)

PRESENTATION_SIGNAL_PHRASES: Tuple[str, ...] = (
    "presentarlo mejor",
    "presentarla mejor",
    "presentar mejor",
    "comunicar mejor",
    "mejorar como presento",
    "mejorar la presentacion",
    "explicar mejor",
    "mensaje de la oferta",
)

POSITIONING_SIGNAL_PHRASES: Tuple[str, ...] = (
    "reposicionar",
    "reposicionarla",
    "reposicionarlo",
    "premiumizar",
    "premiumizarla",
    "premiumizarlo",
    "reformular la oferta",
    "reestructurar como se presenta",
    "posicionarlo",
    "posicionarla",
    "justificar el precio",
)

PREMIUM_SIGNAL_PHRASES: Tuple[str, ...] = (
    "premium",
    "exclusivo",
    "entorno de lujo",
    "alto valor",
    "high ticket",
    "elite",
    "privado",
    "garantizando resultados por contrato",
)

CONVERSION_GOAL_SIGNAL_PHRASES: Tuple[str, ...] = (
    "cerrar mas clientes",
    "captar mas clientes",
    "vender mas",
    "aumentar conversion",
    "preventa",
    "aumentar cierres",
    "justificar el precio",
    "mejorar conversion comercial",
)

# -----------------------------------------------------------------------------
# Senales base — intencion explicita
# -----------------------------------------------------------------------------

EXPLICIT_SELL_INTENT_PHRASES: Tuple[str, ...] = (
    "quiero vender",
    "quiero venderlo",
    "quiero venderla",
    "venderlo",
    "venderla",
    "venderlo como oferta",
    "venderla como oferta",
    "quiero vender mejor",
    "quiero posicionarlo",
    "quiero posicionarla",
)

EXPLICIT_BUILD_INTENT_PHRASES: Tuple[str, ...] = (
    "quiero construir",
    "quiero construirlo",
    "quiero construirla",
    "construirlo",
    "construirla",
    "quiero desarrollar",
    "quiero montarlo",
    "quiero montar",
)

EXPLICIT_VALIDATE_INTENT_PHRASES: Tuple[str, ...] = (
    "quiero validar",
    "quiero validarlo",
    "quiero validarla",
    "validarlo",
    "validarla",
    "validar primero",
    "validarlo primero",
    "validarla primero",
    "si tiene mercado",
    "validar si pega",
)

EXPLICIT_AUTOMATE_INTENT_PHRASES: Tuple[str, ...] = (
    "quiero automatizar",
    "automatizar la clasificacion",
    "automatizar el proceso",
    "automatizarlo",
    "automatizarla",
)

EXPLICIT_DIAGNOSE_INTENT_PHRASES: Tuple[str, ...] = (
    "quiero auditar",
    "quiero diagnosticar",
    "quiero analizar",
    "auditar la web",
    "diagnosticar",
    "analizar la web",
)

MIXED_INTENT_SIGNAL_PHRASES: Tuple[str, ...] = (
    "no se si",
    "o construirlo",
    "o construirla",
    "o venderlo",
    "o venderla",
    "o validarlo",
    "o validarla",
    "pero tambien venderlo",
    "pero tambien venderla",
    "pero tambien construirlo",
    "pero tambien construirla",
)

# -----------------------------------------------------------------------------
# Senales base — construccion / sistema
# -----------------------------------------------------------------------------

BUILD_SIGNAL_PHRASES: Tuple[str, ...] = (
    "quiero crear",
    "quiero montar",
    "quiero desarrollar",
    "quiero construir",
    "crear un sistema",
    "montar un sistema",
    "desarrollar un sistema",
)

SYSTEM_SIGNAL_PHRASES: Tuple[str, ...] = (
    "sistema",
    "plataforma",
    "motor",
    "builder",
    "dashboard",
    "workspace",
    "ecosistema",
    "espacio de trabajo unificado",
)

ARCHITECTURE_SIGNAL_PHRASES: Tuple[str, ...] = (
    "arquitectura",
    "modulos",
    "capas",
    "componentes",
    "infraestructura",
    "sistema completo",
)

INTEGRATION_SIGNAL_PHRASES: Tuple[str, ...] = (
    "integra",
    "integracion",
    "conecta",
    "conectado con",
    "crm",
    "whatsapp",
    "correo electronico",
    "calendario",
)

# -----------------------------------------------------------------------------
# Senales base — automatizacion / ops
# -----------------------------------------------------------------------------

AUTOMATION_SIGNAL_PHRASES: Tuple[str, ...] = (
    "automatizacion",
    "automatizar",
    "autonoma",
    "automatiza",
    "responde objeciones",
    "calificar",
    "agendar citas",
)

FLOW_SIGNAL_PHRASES: Tuple[str, ...] = (
    "flujo",
    "flujos",
    "routing",
    "enrutado",
    "primer contacto",
    "seguimiento inicial",
    "sincroniza",
)

OPS_SIGNAL_PHRASES: Tuple[str, ...] = (
    "ahorrar tiempo",
    "recuperar horas",
    "equipo comercial",
    "equipo de ventas",
    "operacion",
    "operativa",
    "error humano",
    "perdida de oportunidades",
)

# -----------------------------------------------------------------------------
# Senales base — auditoria / mejora
# -----------------------------------------------------------------------------

DIAGNOSTIC_SIGNAL_PHRASES: Tuple[str, ...] = (
    "diagnostico",
    "diagnostico exhaustivo",
    "mapa de riesgos",
    "hoja de ruta",
    "detectar vulnerabilidades",
    "detectar fricciones",
    "prioridades",
    "remediacion inmediata",
)

AUDIT_SIGNAL_PHRASES: Tuple[str, ...] = (
    "auditoria",
    "auditoria 360",
    "auditar",
    "analizar",
    "analice",
    "evaluar",
)

FRICTION_SIGNAL_PHRASES: Tuple[str, ...] = (
    "fricciones",
    "bloqueos",
    "cuellos de botella",
    "vulnerabilidades",
    "riesgos",
    "problemas",
)

IMPROVEMENT_SIGNAL_PHRASES: Tuple[str, ...] = (
    "mejorar",
    "optimizar",
    "priorizar mejoras",
    "remediacion",
    "hoja de ruta",
    "mejoras estructurales",
)

# -----------------------------------------------------------------------------
# Senales base — idea / validacion / incertidumbre
# -----------------------------------------------------------------------------

IDEA_SIGNAL_PHRASES: Tuple[str, ...] = (
    "estoy pensando",
    "la idea",
    "quiero crear algo",
    "seria como",
    "algo que haga",
    "busca transformar",
)

UNCERTAINTY_SIGNAL_PHRASES: Tuple[str, ...] = (
    "no se exactamente",
    "todavia no",
    "aun no",
    "fase de validacion",
    "busca transformar",
    "promete",
    "no se si",
)

VALIDATION_SIGNAL_PHRASES: Tuple[str, ...] = (
    "fase de validacion",
    "validar el interes",
    "quiero saber si tiene mercado",
    "testear interes",
    "validar si pega",
    "si tiene mercado",
)

FORMAT_MISSING_SIGNAL_PHRASES: Tuple[str, ...] = (
    "no se que formato",
    "sin formato claro",
    "todavia no tengo claro",
    "aun no se",
    "falta definir",
)

# -----------------------------------------------------------------------------
# Senales base — densidad descriptiva
# -----------------------------------------------------------------------------

FEATURE_DENSITY_SIGNAL_PHRASES: Tuple[str, ...] = (
    "60 horas de bateria",
    "cancelacion de ruido",
    "llamadas mediante ia",
    "cuero vegano",
    "carga ultrarapida",
    "gemelo digital",
    "crm",
    "whatsapp",
    "correo electronico",
    "datos geneticos",
    "analisis de sangre",
    "plantillas",
    "creditos gratuitos",
)

BENEFIT_DENSITY_SIGNAL_PHRASES: Tuple[str, ...] = (
    "claridad total",
    "recuperar 15 horas",
    "ni un segundo de inactividad",
    "eliminando el error humano",
    "rendimiento humano extremo",
    "sin friccion tecnica",
    "maximizar la conversion",
    "crecimiento acelerado",
)

OUTPUT_DEFINED_SIGNAL_PHRASES: Tuple[str, ...] = (
    "mapa de riesgos",
    "hoja de ruta",
    "agenda citas",
    "sincroniza la reunion",
    "diagnostico",
    "prioridades",
    "recomendaciones",
)

# -----------------------------------------------------------------------------
# Pesos iniciales — input_nature
# -----------------------------------------------------------------------------

INPUT_NATURE_WEIGHTS: Dict[str, Dict[str, int]] = {
    "product_description": {
        "feature_density_signal": 4,
        "benefit_density_signal": 2,
        "offer_language_signal": 1,
        "system_signal": 0,
        "automation_signal": 0,
        "diagnostic_signal": 0,
        "idea_signal": 1,
    },
    "service_offer": {
        "existing_offer_signal": 5,
        "offer_language_signal": 4,
        "presentation_signal": 3,
        "positioning_signal": 3,
        "conversion_goal_signal": 2,
        "explicit_sell_intent_signal": 2,
    },
    "system_concept": {
        "build_signal": 4,
        "system_signal": 5,
        "architecture_signal": 4,
        "integration_signal": 3,
        "explicit_build_intent_signal": 3,
    },
    "automation_flow": {
        "automation_signal": 5,
        "flow_signal": 4,
        "ops_signal": 3,
        "integration_signal": 2,
        "explicit_automate_intent_signal": 3,
    },
    "audit_request": {
        "diagnostic_signal": 5,
        "audit_signal": 4,
        "friction_signal": 4,
        "improvement_signal": 2,
        "explicit_diagnose_intent_signal": 3,
    },
    "idea_validation": {
        "idea_signal": 5,
        "uncertainty_signal": 4,
        "validation_signal": 4,
        "format_missing_signal": 3,
        "explicit_validate_intent_signal": 3,
    },
}

# -----------------------------------------------------------------------------
# Pesos iniciales — user_intent
# -----------------------------------------------------------------------------

USER_INTENT_WEIGHTS: Dict[str, Dict[str, int]] = {
    "sell_this": {
        "existing_offer_signal": 5,
        "offer_language_signal": 4,
        "presentation_signal": 4,
        "positioning_signal": 5,
        "conversion_goal_signal": 3,
        "explicit_sell_intent_signal": 6,
    },
    "position_this": {
        "positioning_signal": 5,
        "premium_signal": 4,
        "presentation_signal": 3,
        "existing_offer_signal": 3,
    },
    "validate_this": {
        "validation_signal": 5,
        "uncertainty_signal": 4,
        "idea_signal": 3,
        "explicit_validate_intent_signal": 6,
    },
    "improve_this": {
        "improvement_signal": 4,
        "friction_signal": 3,
        "existing_offer_signal": 2,
        "diagnostic_signal": 2,
    },
    "build_this": {
        "build_signal": 5,
        "system_signal": 4,
        "architecture_signal": 4,
        "explicit_build_intent_signal": 6,
    },
    "automate_this": {
        "automation_signal": 5,
        "flow_signal": 4,
        "ops_signal": 3,
        "integration_signal": 2,
        "explicit_automate_intent_signal": 6,
    },
    "diagnose_this": {
        "diagnostic_signal": 5,
        "audit_signal": 4,
        "friction_signal": 4,
        "explicit_diagnose_intent_signal": 6,
    },
}

# -----------------------------------------------------------------------------
# Pesos iniciales — maturity_level
# -----------------------------------------------------------------------------

MATURITY_LEVEL_WEIGHTS: Dict[str, Dict[str, int]] = {
    "existing_offer": {
        "existing_offer_signal": 5,
    },
    "defined_solution": {
        "feature_density_signal": 3,
        "benefit_density_signal": 2,
        "system_signal": 2,
        "output_defined_signal": 3,
        "automation_signal": 1,
        "diagnostic_signal": 1,
    },
    "concept_in_definition": {
        "build_signal": 3,
        "system_signal": 1,
        "format_missing_signal": 3,
        "uncertainty_signal": 2,
        "explicit_build_intent_signal": 2,
        "mixed_intent_signal": 2,
    },
    "early_idea": {
        "idea_signal": 5,
        "uncertainty_signal": 4,
        "validation_signal": 3,
        "format_missing_signal": 4,
        "explicit_validate_intent_signal": 2,
        "mixed_intent_signal": 1,
    },
}

# -----------------------------------------------------------------------------
# Precedencias
# -----------------------------------------------------------------------------

USER_INTENT_PRECEDENCE_ORDER: Tuple[str, ...] = (
    "automate_this",
    "diagnose_this",
    "build_this",
    "position_this",
    "sell_this",
    "improve_this",
    "validate_this",
    "unclear",
)

INPUT_NATURE_PRECEDENCE_ORDER: Tuple[str, ...] = (
    "automation_flow",
    "audit_request",
    "system_concept",
    "service_offer",
    "product_description",
    "idea_validation",
    "mixed_input",
)

MATURITY_PRECEDENCE_ORDER: Tuple[str, ...] = (
    "existing_offer",
    "defined_solution",
    "concept_in_definition",
    "early_idea",
)

# -----------------------------------------------------------------------------
# Guardrails nominales
# -----------------------------------------------------------------------------

SEMANTIC_ADMISSION_GUARDRAILS: Tuple[str, ...] = (
    "rich_description_is_not_sell",
    "premium_language_is_not_premium_intent",
    "validation_blocks_sell_without_existing_offer",
    "automation_blocks_sell_when_ops_core_is_dominant",
    "diagnostic_blocks_sell_when_audit_core_is_dominant",
    "voice_disfluency_never_decides_intent",
    "mixed_high_scores_require_clarification",
    "low_confidence_requires_single_question",
    "early_idea_with_commercial_language_requires_disambiguation",
    "strong_nature_without_explicit_intent_requires_clarification",
    "mixed_build_sell_requires_clarification",
    "mixed_validate_build_requires_clarification",
    "existing_offer_requires_existing_offer_signal",
)

# -----------------------------------------------------------------------------
# Plantillas de pregunta unica
# -----------------------------------------------------------------------------

TEXT_CLARIFICATION_TEMPLATES: Dict[str, str] = {
    "generic": (
        "Quieres vender esta oferta, validarla en mercado, construirla o automatizar un proceso?"
    ),
    "offer_without_intent": (
        "Quieres vender esta oferta, mejorar como se presenta o validar si tiene mercado?"
    ),
    "system_vs_sell": (
        "Quieres construir este sistema o venderlo como oferta a clientes?"
    ),
    "idea_early": (
        "Quieres validar la idea o ya tienes claro que quieres venderla?"
    ),
    "automation_vs_sell": (
        "Quieres automatizar el proceso o vender esta solucion como oferta?"
    ),
    "diagnostic_vs_sell": (
        "Quieres vender este servicio o usarlo sobre todo para auditar y diagnosticar?"
    ),
}

VOICE_CLARIFICATION_TEMPLATES: Dict[str, str] = {
    "generic": "Quieres venderlo, validarlo, construirlo o automatizar algo con esto?",
    "offer_without_intent": "Quieres vender esta oferta o validar si tiene mercado?",
    "system_vs_sell": "Quieres construirlo o venderlo como oferta?",
    "idea_early": "Quieres validar la idea o ya venderla?",
    "automation_vs_sell": "Quieres automatizar el proceso o vender la solucion?",
    "diagnostic_vs_sell": "Quieres vender esto o usarlo para auditar?",
}

# -----------------------------------------------------------------------------
# Reglas nominales de precedencia
# -----------------------------------------------------------------------------

PRECEDENCE_RULES: Dict[str, str] = {
    "explicit_intent_over_description": (
        "Si hay verbo/intencion explicita fuerte, domina sobre la riqueza descriptiva."
    ),
    "existing_offer_over_idea": (
        "Si hay oferta existente explicita, no debe clasificarse como idea temprana."
    ),
    "automation_over_sell_when_ops_core": (
        "Si el nucleo es operativo/automatizacion, no debe salir sell por efecto comercial secundario."
    ),
    "diagnostic_over_sell_when_audit_core": (
        "Si el nucleo es auditoria/diagnostico, no debe salir sell por consecuencia comercial."
    ),
    "validation_blocks_sell_without_offer": (
        "Si aparece validacion/idea temprana sin oferta existente, sell queda bloqueado."
    ),
}

# -----------------------------------------------------------------------------
# Validaciones defensivas
# -----------------------------------------------------------------------------

assert set(INPUT_NATURE_WEIGHTS.keys()) == set(ALLOWED_INPUT_NATURES[:-1])
assert set(USER_INTENT_WEIGHTS.keys()) == set(ALLOWED_USER_INTENTS[:-1])
assert set(MATURITY_LEVEL_WEIGHTS.keys()) == set(ALLOWED_MATURITY_LEVELS)