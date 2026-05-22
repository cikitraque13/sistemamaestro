"""
agent_envelope.py

Contrato puente común para entradas, salidas y AgentSpec V1 de agentes.
Sin lógica viva nueva.
"""

from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class AgentInputEnvelope:
    agent_key: str
    request_id: str
    project_id: Optional[str] = None
    user_id: Optional[str] = None
    intent: Optional[str] = None
    payload: Dict[str, Any] = field(default_factory=dict)
    context: Dict[str, Any] = field(default_factory=dict)
    allowed_tools: List[str] = field(default_factory=list)
    guard_layers: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class AgentOutputEnvelope:
    agent_key: str
    request_id: str
    status: str
    output_type: str
    data: Dict[str, Any] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)
    trace_id: Optional[str] = None


@dataclass(frozen=True)
class AgentSpecV1:
    id: str
    visibleName: str
    mission: str
    description: str
    internalInstructions: List[str] = field(default_factory=list)
    triggerWhen: List[str] = field(default_factory=list)
    inputSchema: Dict[str, Any] = field(default_factory=dict)
    outputSchema: Dict[str, Any] = field(default_factory=dict)
    allowedMutationTypes: List[str] = field(default_factory=list)
    allowedTools: List[str] = field(default_factory=list)
    forbiddenDomains: List[str] = field(default_factory=list)
    userFeedback: str = ""
    gemCostTier: str = "none"
    currentState: str = "future"
    supportingFiles: List[str] = field(default_factory=list)
    activationMissing: List[str] = field(default_factory=list)


COMMON_BUILDER_INPUT_SCHEMA: Dict[str, Any] = {
    "projectId": "string|null",
    "userInput": "string",
    "currentBuildState": "BuilderBuildState|null",
    "builderOutputMap": "BuilderOutputMap|null",
}

COMMON_STRUCTURED_OUTPUT_SCHEMA: Dict[str, Any] = {
    "status": "ready|blocked|needs_review",
    "summary": "string",
    "recommendations": "string[]",
    "mutationTypes": "string[]",
    "warnings": "string[]",
}

AGENT_SPEC_V1_REGISTRY: Dict[str, AgentSpecV1] = {
    "builder_agent": AgentSpecV1(
        id="builder_agent",
        visibleName="Builder Agent",
        mission="Convertir intención del usuario en mutaciones aplicables por el Builder.",
        description="Motor principal parcial del Builder AI. Debe producir salidas estructuradas compatibles con BuilderBuildState y OutputMap.",
        internalInstructions=[
            "No responder como chat genérico.",
            "No prometer deploy, hosting ni exportación real.",
            "No sustituir BuilderBuildState completo.",
            "Devolver cambios aplicables por el kernel del Builder.",
        ],
        triggerWhen=["primera construcción", "iteración libre", "fallback de decisión guiada"],
        inputSchema={**COMMON_BUILDER_INPUT_SCHEMA, "mode": "build|iterate|repair"},
        outputSchema={
            "intent": "string",
            "projectKind": "landing|web|app|dashboard|logo|component|unknown",
            "mutations": "BuilderAIMutation[]",
            "previewModelPatch": "object",
            "codeModelPatch": "object",
            "structureModelPatch": "object",
            "assistantMessage": "string",
            "nextAction": "string",
            "warnings": "string[]",
        },
        allowedMutationTypes=[
            "improve_premium_conversion",
            "improve_copy",
            "apply_visual_hierarchy",
            "validate_ready_for_export",
            "add_how_it_works",
            "add_trust_section",
            "add_booking_flow",
            "add_leads_form",
            "add_subscription_box",
            "generate_folder_structure",
            "prepare_export_plan",
        ],
        allowedTools=["openai_json", "builder_kernel", "output_shape_validator"],
        forbiddenDomains=["autonomous_deploy", "pricing_strategy", "payments", "secrets"],
        userFeedback="He aplicado una mejora estructurada al Builder.",
        gemCostTier="medium",
        currentState="live_partial",
        supportingFiles=[
            "backend/app/ai/agents/builder_agent.py",
            "backend/app/routers/builder_ai.py",
            "frontend/src/features/builder/state/builderBuildKernel.js",
        ],
        activationMissing=["contrato mutationType más estricto", "traza visible por acción", "QA por plantilla"],
    ),
    "cro_agent": AgentSpecV1(
        id="cro_agent",
        visibleName="CRO Agent",
        mission="Mejorar conversión, CTA y continuidad comercial sin tocar backend.",
        description="Agente seguro para decisiones de conversión en landing y funnel.",
        internalInstructions=["Priorizar claridad de oferta", "No modificar precios reales", "No tocar auth ni pagos"],
        triggerWhen=["baja claridad de CTA", "landing sin captación", "fase conversión"],
        inputSchema=COMMON_BUILDER_INPUT_SCHEMA,
        outputSchema=COMMON_STRUCTURED_OUTPUT_SCHEMA,
        allowedMutationTypes=[
            "improve_copy",
            "improve_premium_conversion",
            "add_leads_form",
            "add_booking_flow",
            "add_subscription_box",
        ],
        allowedTools=["journey_analyzer", "cta_mapper", "builder_kernel"],
        forbiddenDomains=["backend_runtime", "auth_security", "payments", "deploy"],
        userFeedback="He reforzado la conversión y el siguiente paso del usuario.",
        gemCostTier="low",
        currentState="spec_only",
        supportingFiles=["backend/app/ai/agents/cro_agent.py", "frontend/src/features/builder/components/BuilderAgentPane.js"],
        activationMissing=["función viva", "mapeo AgentRail", "tests de mutación"],
    ),
    "copy_agent": AgentSpecV1(
        id="copy_agent",
        visibleName="Copy Agent",
        mission="Mejorar claridad, titulares, microcopy y CTAs del Builder sin tocar runtime.",
        description="Agente interno de copy para aplicar la mutación improve_copy como atajo experto tipado.",
        internalInstructions=[
            "No responder como chat libre.",
            "No inventar claims no demostrables.",
            "No modificar precios, pagos, auth ni backend.",
            "Devolver mejoras aplicables por BuilderBuildState y OutputMap.",
        ],
        triggerWhen=["copy poco claro", "CTA débil", "promesa confusa", "usuario pide mejorar textos"],
        inputSchema=COMMON_BUILDER_INPUT_SCHEMA,
        outputSchema=COMMON_STRUCTURED_OUTPUT_SCHEMA,
        allowedMutationTypes=["improve_copy"],
        allowedTools=["copy_mapper", "builder_kernel", "output_shape_validator"],
        forbiddenDomains=["backend_runtime", "payments", "deploy", "fake_claims", "secrets"],
        userFeedback="He mejorado titulares, CTA y microcopy del proyecto.",
        gemCostTier="medium",
        currentState="spec_only",
        supportingFiles=[
            "frontend/src/features/builder/components/BuilderAgentPane.js",
            "frontend/src/features/builder/state/builderMutationRegistry.js",
            "frontend/src/features/builder/state/builderBuildState.js",
        ],
        activationMissing=["función viva opcional", "tests de mutación", "QA por plantilla"],
    ),
    "visual_agent": AgentSpecV1(
        id="visual_agent",
        visibleName="Visual Agent",
        mission="Aplicar jerarquía visual, escaneabilidad y orden de secciones sin rediseño manual.",
        description="Agente interno visual para aplicar la mutación apply_visual_hierarchy como atajo experto tipado.",
        internalInstructions=[
            "No tocar CSS global manualmente desde AgentSpec.",
            "No cambiar router ni backend.",
            "No iniciar rediseño visual fuera del Builder.",
            "Representar cambios mediante mutaciones consumibles por BuilderBuildState y OutputMap.",
        ],
        triggerWhen=["jerarquía débil", "landing difícil de escanear", "usuario pide mejorar diseño", "orden visual confuso"],
        inputSchema=COMMON_BUILDER_INPUT_SCHEMA,
        outputSchema=COMMON_STRUCTURED_OUTPUT_SCHEMA,
        allowedMutationTypes=["apply_visual_hierarchy"],
        allowedTools=["layout_mapper", "builder_kernel", "output_shape_validator"],
        forbiddenDomains=["backend_runtime", "router", "deploy", "package_changes", "secrets"],
        userFeedback="He aplicado jerarquía visual y mejor escaneabilidad al proyecto.",
        gemCostTier="medium",
        currentState="spec_only",
        supportingFiles=[
            "frontend/src/features/builder/components/BuilderAgentPane.js",
            "frontend/src/features/builder/state/builderMutationRegistry.js",
            "frontend/src/features/builder/state/builderBuildState.js",
        ],
        activationMissing=["función viva opcional", "tests de mutación", "QA visual por plantilla"],
    ),
    "trust_agent": AgentSpecV1(
        id="trust_agent",
        visibleName="Trust Agent",
        mission="Añadir confianza, prueba social y objeciones resueltas.",
        description="Agente ligero para aumentar credibilidad sin crear claims no demostrables.",
        internalInstructions=["No inventar testimonios reales", "Usar claims prudentes", "Priorizar objeciones frecuentes"],
        triggerWhen=["fase confianza", "landing sin prueba social", "usuario pide autoridad"],
        inputSchema=COMMON_BUILDER_INPUT_SCHEMA,
        outputSchema=COMMON_STRUCTURED_OUTPUT_SCHEMA,
        allowedMutationTypes=[
            "add_trust_section",
            "add_how_it_works",
            "add_faq_objections",
            "validate_ready_for_export",
        ],
        allowedTools=["objection_mapper", "builder_kernel"],
        forbiddenDomains=["fake_reviews", "medical_claims", "legal_claims", "payments"],
        userFeedback="He añadido señales de confianza y objeciones resueltas.",
        gemCostTier="low",
        currentState="spec_only",
        supportingFiles=["frontend/src/features/builder/state/builderMutationRegistry.js"],
        activationMissing=["archivo agente backend opcional", "mapeo AgentRail", "biblioteca de objeciones por sector"],
    ),
    "system_architect_agent": AgentSpecV1(
        id="system_architect_agent",
        visibleName="System Architect Agent",
        mission="Validar arquitectura, capas y ownership del sistema.",
        description="Agente puente puro para decisiones estructurales; no aplica mutaciones directas.",
        internalInstructions=["No escribir código", "No tocar runtime", "Separar decisión arquitectónica de ejecución"],
        triggerWhen=["salida técnica", "estructura incoherente", "revisión phase_2"],
        inputSchema={"scope": "string", "layers": "string[]", "builder_ai_output": "object|null"},
        outputSchema=COMMON_STRUCTURED_OUTPUT_SCHEMA,
        allowedMutationTypes=[],
        allowedTools=["structure_mapper", "decision_registry"],
        forbiddenDomains=["payments", "marketing_copy", "runtime_write"],
        userFeedback="He revisado la arquitectura y las capas afectadas.",
        gemCostTier="none",
        currentState="bridge_live_pure",
        supportingFiles=["backend/app/ai/agents/system_architect_agent.py", "backend/app/ai/orchestrators/master_orchestrator.py"],
        activationMissing=["conexión consultiva al Builder", "gates de salida técnica"],
    ),
    "security_architect_agent": AgentSpecV1(
        id="security_architect_agent",
        visibleName="Security Architect Agent",
        mission="Detectar riesgos, superficies sensibles y gates de seguridad.",
        description="Agente puente puro de seguridad; no lee secretos ni toca producción.",
        internalInstructions=["No pedir secretos", "No mostrar credenciales", "Bloquear auth/pagos/deploy sin gate explícito"],
        triggerWhen=["auth", "pagos", "deploy", "tokens", "producción", "phase_2_review"],
        inputSchema={"project_id": "string|null", "user_id": "string|null", "touched_surfaces": "string[]"},
        outputSchema={**COMMON_STRUCTURED_OUTPUT_SCHEMA, "risk_level": "low|medium|high"},
        allowedMutationTypes=[],
        allowedTools=["policy_validator", "session_audit", "abuse_patterns"],
        forbiddenDomains=["general_ui_build", "secret_read", "production_write"],
        userFeedback="He revisado riesgos y gates antes de avanzar.",
        gemCostTier="none",
        currentState="bridge_live_pure",
        supportingFiles=["backend/app/ai/agents/security_architect_agent.py", "backend/app/ai/guards/security_guard.py"],
        activationMissing=["gate explícito en flujos sensibles", "traza de revisión visible"],
    ),
}


def serialize_input(envelope: AgentInputEnvelope) -> Dict[str, Any]:
    return asdict(envelope)


def serialize_output(envelope: AgentOutputEnvelope) -> Dict[str, Any]:
    return asdict(envelope)


def serialize_agent_spec(spec: AgentSpecV1) -> Dict[str, Any]:
    return asdict(spec)


def get_agent_spec_v1(agent_id: str) -> Optional[Dict[str, Any]]:
    spec = AGENT_SPEC_V1_REGISTRY.get(agent_id)
    return serialize_agent_spec(spec) if spec else None


def list_agent_specs_v1() -> Dict[str, Dict[str, Any]]:
    return {
        agent_id: serialize_agent_spec(spec)
        for agent_id, spec in AGENT_SPEC_V1_REGISTRY.items()
    }
