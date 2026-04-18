"""
tool_registry.py

Registro puente de herramientas disponibles para agentes.
Sin integración real todavía.
"""

from dataclasses import dataclass, asdict
from typing import Dict, Tuple


@dataclass(frozen=True)
class ToolContract:
    key: str
    domain: str
    description: str
    phase: str


TOOL_REGISTRY: Dict[str, ToolContract] = {
    "intent_classifier": ToolContract(
        key="intent_classifier",
        domain="routing",
        description="Clasifica intención inicial del usuario.",
        phase="now",
    ),
    "route_mapper": ToolContract(
        key="route_mapper",
        domain="routing",
        description="Asigna ruta recomendada a partir de intención y contexto.",
        phase="now",
    ),
    "url_reader": ToolContract(
        key="url_reader",
        domain="audit",
        description="Lee señales visibles de una URL o activo digital.",
        phase="now",
    ),
    "signal_analyzer": ToolContract(
        key="signal_analyzer",
        domain="audit",
        description="Analiza fricciones, señales de mercado y estructura visible.",
        phase="now",
    ),
    "report_formatter": ToolContract(
        key="report_formatter",
        domain="reporting",
        description="Formatea salidas de informe en estructura consistente.",
        phase="now",
    ),
    "output_schema_validator": ToolContract(
        key="output_schema_validator",
        domain="reporting",
        description="Valida que el output cumpla un contrato estructural.",
        phase="now",
    ),
    "repo_reader": ToolContract(
        key="repo_reader",
        domain="builder",
        description="Lee estructura y archivos del repositorio.",
        phase="next",
    ),
    "repo_writer": ToolContract(
        key="repo_writer",
        domain="builder",
        description="Escribe cambios controlados en archivos autorizados.",
        phase="next",
    ),
    "code_validator": ToolContract(
        key="code_validator",
        domain="builder",
        description="Valida sintaxis y consistencia básica de cambios técnicos.",
        phase="next",
    ),
    "log_reader": ToolContract(
        key="log_reader",
        domain="ops",
        description="Lee logs de runtime, deploy y errores.",
        phase="now",
    ),
    "runtime_probe": ToolContract(
        key="runtime_probe",
        domain="ops",
        description="Inspecciona estado de arranque y señales de health.",
        phase="now",
    ),
    "env_validator": ToolContract(
        key="env_validator",
        domain="ops",
        description="Valida variables de entorno y consistencia de configuración.",
        phase="now",
    ),
    "deploy_checklist": ToolContract(
        key="deploy_checklist",
        domain="deploy",
        description="Revisa pasos requeridos antes de un release.",
        phase="next",
    ),
    "policy_validator": ToolContract(
        key="policy_validator",
        domain="security",
        description="Valida reglas permitidas y prohibidas por contexto.",
        phase="next",
    ),
    "session_audit": ToolContract(
        key="session_audit",
        domain="security",
        description="Revisa sesiones, cookies y vectores de autenticación.",
        phase="next",
    ),
    "abuse_patterns": ToolContract(
        key="abuse_patterns",
        domain="security",
        description="Detecta patrones de abuso y uso anómalo.",
        phase="next",
    ),
    "funnel_mapper": ToolContract(
        key="funnel_mapper",
        domain="growth",
        description="Mapea activación, continuidad y monetización.",
        phase="later",
    ),
    "growth_hypothesis_engine": ToolContract(
        key="growth_hypothesis_engine",
        domain="growth",
        description="Propone hipótesis de crecimiento estructuradas.",
        phase="later",
    ),
    "journey_analyzer": ToolContract(
        key="journey_analyzer",
        domain="cro",
        description="Analiza fricción del recorrido del usuario.",
        phase="later",
    ),
    "cta_mapper": ToolContract(
        key="cta_mapper",
        domain="cro",
        description="Mapea continuidad de CTA y puntos de decisión.",
        phase="later",
    ),
    "seo_mapper": ToolContract(
        key="seo_mapper",
        domain="seo",
        description="Mapea estructura indexable y señales SEO técnicas.",
        phase="later",
    ),
    "semantic_structure_checker": ToolContract(
        key="semantic_structure_checker",
        domain="seo",
        description="Revisa jerarquía semántica y coherencia de estructura.",
        phase="later",
    ),
    "output_sampler": ToolContract(
        key="output_sampler",
        domain="quality",
        description="Toma muestras de outputs para auditoría algorítmica.",
        phase="later",
    ),
    "consistency_checker": ToolContract(
        key="consistency_checker",
        domain="quality",
        description="Evalúa estabilidad y consistencia de salidas.",
        phase="later",
    ),
}


def get_tool_manifest():
    return {key: asdict(value) for key, value in TOOL_REGISTRY.items()}