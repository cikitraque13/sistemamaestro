#!/usr/bin/env python3
"""
QA estático de alineación backend/app/ai.

No activa runtime, router, endpoints, consumo, deploy ni servicios externos.
Valida inventario y contratos de la capa IA backend.
"""

from __future__ import annotations

import ast
import importlib.util
import sys
from pathlib import Path
from typing import Dict, Iterable, List, Set

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
AI_ROOT = ROOT / "backend/app/ai"
AGENTS_DIR = AI_ROOT / "agents"
AGENT_SPEC_PATH = AI_ROOT / "schemas/agent_envelope.py"
ORCHESTRATOR_PATH = AI_ROOT / "orchestrators/master_orchestrator.py"
TOOL_REGISTRY_PATH = AI_ROOT / "tools/tool_registry.py"
GUARDS_DIR = AI_ROOT / "guards"

EXPECTED_AGENT_STATUS = {
    "builder_agent": "live_partial",
    "report_agent": "live_pure",
    "system_architect_agent": "live_pure",
    "security_architect_agent": "live_pure",
    "red_team_agent": "manifest_only",
    "copy_agent": "spec_only",
    "visual_agent": "spec_only",
    "trust_agent": "spec_only",
    "discovery_agent": "empty",
    "audit_agent": "empty",
    "cro_agent": "empty",
    "seo_architect_agent": "empty",
    "growth_agent": "empty",
    "deploy_agent": "empty",
    "rescue_sre_agent": "empty",
    "algorithmic_auditor_agent": "empty",
}

LIVE_GUARDS = {
    "policy_guard": "evaluate_policy",
    "security_guard": "assess_security_context",
    "cost_guard": "assess_cost",
    "output_guard": "validate_output_shape",
}

KNOWN_SPEC_TOOLS_NOT_IN_TOOL_REGISTRY = {
    "builder_kernel",
    "copy_mapper",
    "decision_registry",
    "layout_mapper",
    "objection_mapper",
    "openai_json",
    "output_shape_validator",
    "structure_mapper",
}

KNOWN_UNINTEGRATED_GUARDS = {"abuse_guard": "assess_abuse"}
FORBIDDEN_EDIT_SURFACES = ("backend/app/routers/", ".github/workflows", "package.json", "package-lock.json")


def fail(message: str) -> None:
    raise AssertionError(message)


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8-sig")


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        fail(f"cannot load module: {path.relative_to(ROOT)}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def module_defs(path: Path) -> Set[str]:
    tree = ast.parse(read(path))
    defs: Set[str] = set()
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            defs.add(node.name)
    return defs


def agent_files() -> Dict[str, Path]:
    return {
        path.stem: path
        for path in AGENTS_DIR.glob("*.py")
        if path.name != "__init__.py"
    }


def classify_agent(agent_key: str, path: Path | None, specs: Dict[str, dict], orchestrator_agents: Set[str]) -> str:
    if path is None:
        return "spec_only" if agent_key in specs else "missing"

    if path.stat().st_size == 0:
        return "empty"

    defs = module_defs(path)
    if agent_key == "builder_agent" and "run_builder_agent" in defs:
        return "live_partial"
    if agent_key in {"report_agent", "system_architect_agent", "security_architect_agent"} and any(
        name.startswith("run_") for name in defs
    ):
        return "live_pure"
    if agent_key == "red_team_agent" and "get_red_team_manifest" in defs:
        return "manifest_only"
    if agent_key in specs and agent_key not in orchestrator_agents:
        return "spec_only"
    return "bridge"


def validate_agent_specs() -> Dict[str, dict]:
    module = load_module(AGENT_SPEC_PATH, "agent_envelope_alignment")
    specs = module.list_agent_specs_v1()
    if not isinstance(specs, dict) or not specs:
        fail("AgentSpec V1 registry is empty or not serializable")
    for key, spec in specs.items():
        for required in ("id", "allowedTools", "allowedMutationTypes", "forbiddenDomains", "currentState"):
            if required not in spec:
                fail(f"AgentSpec {key} missing {required}")
    return specs


def validate_orchestrator() -> Dict[str, dict]:
    module = load_module(ORCHESTRATOR_PATH, "master_orchestrator_alignment")
    manifest = module.get_orchestrator_manifest()
    if manifest.get("runtime_multiagent") is not False:
        fail("master_orchestrator must not enable runtime_multiagent")
    agents = manifest.get("agents") or {}
    if not isinstance(agents, dict) or not agents:
        fail("master_orchestrator AGENT_REGISTRY manifest is empty")
    return agents


def validate_tools(specs: Dict[str, dict]) -> Dict[str, dict]:
    module = load_module(TOOL_REGISTRY_PATH, "tool_registry_alignment")
    tools = module.get_tool_manifest()
    if not isinstance(tools, dict) or not tools:
        fail("tool_registry manifest is empty")

    declared_tools = set()
    for spec in specs.values():
        declared_tools.update(spec.get("allowedTools", []))

    missing_tools = sorted(tool for tool in declared_tools if tool not in tools)
    unexpected_missing = sorted(set(missing_tools) - KNOWN_SPEC_TOOLS_NOT_IN_TOOL_REGISTRY)
    if unexpected_missing:
        fail(f"AgentSpec references unexpected tools missing from tool_registry: {unexpected_missing}")

    executable_markers = {"execute", "run", "call", "invoke"}
    tool_defs = module_defs(TOOL_REGISTRY_PATH)
    if executable_markers & tool_defs:
        fail("tool_registry exposes executable-looking tool functions; expected manifest only")

    return tools


def validate_guards(specs: Dict[str, dict]) -> Dict[str, str]:
    guard_files = {path.stem: path for path in GUARDS_DIR.glob("*_guard.py")}
    for guard_name, expected_fn in {**LIVE_GUARDS, **KNOWN_UNINTEGRATED_GUARDS}.items():
        if guard_name not in guard_files:
            fail(f"missing guard file: {guard_name}")
        if expected_fn not in module_defs(guard_files[guard_name]):
            fail(f"guard {guard_name} missing function {expected_fn}")

    forbidden_domains = set()
    for spec in specs.values():
        forbidden_domains.update(spec.get("forbiddenDomains", []))
    if not forbidden_domains:
        fail("AgentSpec forbiddenDomains are empty across registry")

    return {name: str(path.relative_to(ROOT)) for name, path in guard_files.items()}


def validate_agent_alignment(specs: Dict[str, dict], orchestrator_agents: Dict[str, dict]) -> Dict[str, str]:
    files = agent_files()
    all_agents = set(specs) | set(orchestrator_agents) | set(files)
    matrix = {
        agent_key: classify_agent(agent_key, files.get(agent_key), specs, set(orchestrator_agents))
        for agent_key in sorted(all_agents)
    }

    for agent_key, expected in EXPECTED_AGENT_STATUS.items():
        actual = matrix.get(agent_key)
        if actual != expected:
            fail(f"unexpected agent status for {agent_key}: expected={expected} actual={actual}")

    specs_without_logic = sorted(key for key, status in matrix.items() if status == "spec_only")
    if not {"copy_agent", "visual_agent", "trust_agent"}.issubset(specs_without_logic):
        fail("expected copy_agent, visual_agent and trust_agent to be spec_only")

    return matrix


def validate_no_forbidden_surface() -> None:
    edited_targets = ["tests/ai_backend_alignment_qa.py"]
    for target in edited_targets:
        if any(surface in target for surface in FORBIDDEN_EDIT_SURFACES):
            fail(f"forbidden surface touched: {target}")


def main() -> int:
    specs = validate_agent_specs()
    orchestrator_agents = validate_orchestrator()
    tools = validate_tools(specs)
    guards = validate_guards(specs)
    matrix = validate_agent_alignment(specs, orchestrator_agents)
    validate_no_forbidden_surface()

    print("AI_BACKEND_ALIGNMENT_QA_OK")
    print("agent_status_matrix=" + repr(matrix))
    print(f"agentspec_count={len(specs)}")
    print(f"orchestrator_agents={len(orchestrator_agents)}")
    print(f"tool_manifest_count={len(tools)}")
    print(f"guards_count={len(guards)}")
    print("runtime_backend_new=false")
    print("router_touched=false")
    print("workflows_package_touched=false")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"AI_BACKEND_ALIGNMENT_QA_FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
