"""
master_orchestrator.py

Bridge infrastructure for the master intelligence of Sistema Maestro.

State:
- no live logic
- not connected to runtime
- does not route real calls yet
- defines manifest, hierarchy and base contracts
"""

from dataclasses import dataclass, asdict
from typing import Any, Dict, Tuple

from backend.app.ai.agents.report_agent import run_report_agent
from backend.app.ai.agents.security_architect_agent import run_security_architect_agent
from backend.app.ai.agents.system_architect_agent import run_system_architect_agent


ORCHESTRATOR_NAME = "master_orchestrator"
ORCHESTRATOR_VERSION = "v1"
ORCHESTRATOR_STATE = "bridge"
PHASE_1_AGENT_KEYS: Tuple[str, ...] = (
    "builder_agent",
    "system_architect_agent",
    "security_architect_agent",
    "report_agent",
)


@dataclass(frozen=True)
class AgentContract:
    key: str
    role: str
    mission: str
    allowed_tools: Tuple[str, ...]
    forbidden_domains: Tuple[str, ...]
    output_type: str
    phase: str


AGENT_REGISTRY: Dict[str, AgentContract] = {
    "discovery_agent": AgentContract(
        key="discovery_agent",
        role="entry_and_discovery",
        mission="Classify early-stage user intent and reduce ambiguity.",
        allowed_tools=("intent_classifier", "route_mapper"),
        forbidden_domains=("deploy", "payments", "code_write"),
        output_type="discovery_brief",
        phase="now",
    ),
    "audit_agent": AgentContract(
        key="audit_agent",
        role="url_market_audit",
        mission="Audit URLs, market signals and visible structural friction.",
        allowed_tools=("url_reader", "signal_analyzer"),
        forbidden_domains=("deploy", "code_write", "payments"),
        output_type="audit_report",
        phase="now",
    ),
    "report_agent": AgentContract(
        key="report_agent",
        role="structured_reporting",
        mission="Convert findings into reliable and structured reports.",
        allowed_tools=("report_formatter", "output_schema_validator"),
        forbidden_domains=("deploy", "infra_changes", "code_write"),
        output_type="report_document",
        phase="phase_1_minimal",
    ),
    "system_architect_agent": AgentContract(
        key="system_architect_agent",
        role="architecture",
        mission="Define canonical structure, layers and system ownership.",
        allowed_tools=("structure_mapper", "decision_registry"),
        forbidden_domains=("payments", "marketing_copy"),
        output_type="architecture_decision",
        phase="phase_1_minimal",
    ),
    "builder_agent": AgentContract(
        key="builder_agent",
        role="code_construction",
        mission="Create or modify code within closed architectural scope.",
        allowed_tools=("repo_reader", "repo_writer", "code_validator"),
        forbidden_domains=("pricing_strategy", "security_policy", "autonomous_deploy"),
        output_type="code_change_set",
        phase="phase_1_minimal",
    ),
    "rescue_sre_agent": AgentContract(
        key="rescue_sre_agent",
        role="runtime_reliability",
        mission="Diagnose runtime failures, healthcheck issues and deploy incidents.",
        allowed_tools=("log_reader", "runtime_probe", "env_validator"),
        forbidden_domains=("ux_redesign", "pricing_strategy"),
        output_type="incident_diagnosis",
        phase="now",
    ),
    "security_architect_agent": AgentContract(
        key="security_architect_agent",
        role="security",
        mission="Detect security gaps and propose hardening priorities.",
        allowed_tools=("policy_validator", "session_audit", "abuse_patterns"),
        forbidden_domains=("marketing_copy", "general_ui_build"),
        output_type="security_findings",
        phase="phase_1_minimal",
    ),
    "red_team_agent": AgentContract(
        key="red_team_agent",
        role="adversarial_security",
        mission="Detect hostile patterns, abuse vectors and security gaps from a defensive adversarial perspective.",
        allowed_tools=("policy_validator", "session_audit", "abuse_patterns", "output_sampler", "consistency_checker"),
        forbidden_domains=("repo_writer", "autonomous_deploy", "live_attack_execution", "payment_mutation", "production_access"),
        output_type="red_team_findings",
        phase="next",
    ),
    "growth_agent": AgentContract(
        key="growth_agent",
        role="growth",
        mission="Detect growth opportunities in activation, retention and monetization.",
        allowed_tools=("funnel_mapper", "growth_hypothesis_engine"),
        forbidden_domains=("runtime_patch", "security_policy"),
        output_type="growth_actions",
        phase="later",
    ),
    "cro_agent": AgentContract(
        key="cro_agent",
        role="conversion",
        mission="Reduce conversion friction and improve CTA continuity.",
        allowed_tools=("journey_analyzer", "cta_mapper"),
        forbidden_domains=("backend_runtime", "auth_security"),
        output_type="cro_recommendations",
        phase="later",
    ),
    "seo_architect_agent": AgentContract(
        key="seo_architect_agent",
        role="technical_seo",
        mission="Improve indexable architecture and technical SEO signals.",
        allowed_tools=("seo_mapper", "semantic_structure_checker"),
        forbidden_domains=("payments", "runtime_patch"),
        output_type="seo_architecture_notes",
        phase="later",
    ),
    "deploy_agent": AgentContract(
        key="deploy_agent",
        role="deploy_ops",
        mission="Validate deploy paths, runtime configuration and release readiness.",
        allowed_tools=("deploy_checklist", "env_validator", "health_probe"),
        forbidden_domains=("pricing_strategy", "ui_copy"),
        output_type="deploy_status",
        phase="next",
    ),
    "algorithmic_auditor_agent": AgentContract(
        key="algorithmic_auditor_agent",
        role="quality_audit",
        mission="Audit consistency, bias and structural quality of AI outputs.",
        allowed_tools=("output_sampler", "consistency_checker"),
        forbidden_domains=("code_write", "deploy", "payments"),
        output_type="algorithmic_audit",
        phase="later",
    ),
}


GUARD_LAYERS: Tuple[str, ...] = (
    "policy_guard",
    "security_guard",
    "abuse_guard",
    "output_guard",
    "cost_guard",
)


def get_orchestrator_manifest() -> Dict[str, object]:
    return {
        "name": ORCHESTRATOR_NAME,
        "version": ORCHESTRATOR_VERSION,
        "state": ORCHESTRATOR_STATE,
        "agents": {key: asdict(value) for key, value in AGENT_REGISTRY.items()},
        "phase_1_agents": list(PHASE_1_AGENT_KEYS),
        "runtime_multiagent": False,
        "guards": list(GUARD_LAYERS),
    }

def run_builder_phase_2_review(context: Dict[str, Any]) -> Dict[str, Any]:
    """Coordinate a pure phase-2 Builder review without touching live runtime."""

    builder_output = context.get("builder_ai_output") or {}
    project_id = context.get("project_id")
    user_id = context.get("user_id")

    architecture = run_system_architect_agent(
        {
            "scope": project_id or "builder_phase_2_review",
            "project_id": project_id,
            "layers": ["builder_ai_output", "BuilderBuildState", "preview", "code", "structure"],
            "builder_ai_output": builder_output,
        }
    )

    touched_surfaces = set(context.get("touched_surfaces") or [])
    if builder_output.get("monetizationSignal"):
        touched_surfaces.add("payments")

    security = run_security_architect_agent(
        {
            "project_id": project_id,
            "user_id": user_id,
            "touched_surfaces": sorted(touched_surfaces),
            "builder_ai_output": builder_output,
        }
    )

    report = run_report_agent(
        {
            "title": "Builder Phase 2 Review",
            "summary": "Revisión pura de salida Builder AI sin conexión al runtime vivo.",
            "findings": [
                *architecture.get("findings", []),
                *security.get("findings", []),
            ],
            "recommendations": [
                *architecture.get("recommendations", []),
                *security.get("recommendations", []),
            ],
            "next_actions": [
                *architecture.get("next_actions", []),
                *security.get("next_actions", []),
            ],
            "source": "builder_phase_2_review",
        }
    )

    return {
        "status": "reviewed",
        "state": ORCHESTRATOR_STATE,
        "runtime_multiagent": False,
        "agents_used": [
            "system_architect_agent",
            "security_architect_agent",
            "report_agent",
        ],
        "architecture": architecture,
        "security": security,
        "report": report,
    }
