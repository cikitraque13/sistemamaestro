#!/usr/bin/env python3
"""
QA aislado de cadena IA base V1.

Valida contratos estáticos sin activar runtime backend, router, endpoints,
export, deploy, GitHub interno ni servicios externos.
"""

from __future__ import annotations

import importlib.util
import re
import sys
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

ROOT = Path(__file__).resolve().parents[1]
AGENT_SPEC_PATH = ROOT / "backend/app/ai/schemas/agent_envelope.py"
AGENT_RAIL_PATH = ROOT / "frontend/src/features/builder/components/BuilderAgentPane.js"
REGISTRY_PATH = ROOT / "frontend/src/features/builder/state/builderMutationRegistry.js"
BUILD_STATE_PATH = ROOT / "frontend/src/features/builder/state/builderBuildState.js"
OUTPUT_MAP_PATH = ROOT / "frontend/src/features/builder/state/builderOutputMap.js"

EXPECTED_MUTATION_TYPES = {
    "improve_copy",
    "apply_visual_hierarchy",
    "validate_ready_for_export",
    "add_trust_section",
    "improve_premium_conversion",
    "generate_folder_structure",
}

EXPECTED_AGENT_MUTATIONS = {
    "copy_agent": {"improve_copy"},
    "visual_agent": {"apply_visual_hierarchy"},
    "trust_agent": {"validate_ready_for_export", "add_trust_section"},
    "cro_agent": {"improve_premium_conversion"},
    "builder_agent": {"generate_folder_structure"},
}

FORBIDDEN_PATH_PATTERNS = (
    "/routers/",
    "/router/",
    ".github/workflows",
    "package.json",
    "package-lock.json",
)


def fail(message: str) -> None:
    raise AssertionError(message)


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_agent_specs() -> Dict[str, dict]:
    spec = importlib.util.spec_from_file_location("agent_envelope", AGENT_SPEC_PATH)
    if spec is None or spec.loader is None:
        fail("AgentSpec module cannot be loaded")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    specs = module.list_agent_specs_v1()

    if not isinstance(specs, dict) or not specs:
        fail("AgentSpec registry is not a non-empty serializable dict")

    for agent_id, agent_spec in specs.items():
        if not isinstance(agent_spec, dict):
            fail(f"AgentSpec is not serialized as dict: {agent_id}")
        for key in ("id", "visibleName", "allowedMutationTypes", "currentState"):
            if key not in agent_spec:
                fail(f"AgentSpec missing {key}: {agent_id}")

    return specs


def extract_agentrail_actions(source: str) -> List[Tuple[str, str]]:
    actions = re.findall(
        r"agentSpecId:\s*'([^']+)'.*?mutationType:\s*'([^']+)'",
        source,
        flags=re.S,
    )
    if not actions:
        fail("AgentRail actions not found")
    return actions


def extract_mutation_types(source: str) -> set[str]:
    mutation_types = set(re.findall(r"\b[A-Z_]+:\s*\"([a-z_]+)\"", source))
    if not mutation_types:
        fail("BUILDER_MUTATION_TYPES not found")
    return mutation_types


def assert_contains_all(source: str, tokens: Iterable[str], label: str) -> None:
    missing = [token for token in tokens if token not in source]
    if missing:
        fail(f"{label} missing tokens: {missing}")


def validate_agent_contracts(specs: Dict[str, dict], agentrail_actions: List[Tuple[str, str]]) -> None:
    for agent_id, mutation_type in agentrail_actions:
        if agent_id not in specs:
            fail(f"AgentRail references missing agentSpecId: {agent_id}")
        allowed = set(specs[agent_id].get("allowedMutationTypes", []))
        if mutation_type not in allowed:
            fail(f"mutationType not allowed for {agent_id}: {mutation_type}")

    for agent_id, required_mutations in EXPECTED_AGENT_MUTATIONS.items():
        if agent_id not in specs:
            fail(f"expected AgentSpec missing: {agent_id}")
        allowed = set(specs[agent_id].get("allowedMutationTypes", []))
        missing = required_mutations - allowed
        if missing:
            fail(f"AgentSpec allowedMutationTypes incomplete for {agent_id}: {sorted(missing)}")


def validate_registry(source: str, mutation_types: set[str]) -> None:
    missing = EXPECTED_MUTATION_TYPES - mutation_types
    if missing:
        fail(f"expected mutation types missing: {sorted(missing)}")

    for mutation_type in EXPECTED_MUTATION_TYPES:
        if mutation_type not in source:
            fail(f"mutationType not registered/buildable: {mutation_type}")

    unknown_returns_null = "if (!definition || typeof definition.build !== \"function\")" in source and "return null" in source
    if not unknown_returns_null:
        fail("buildMutationFromType unknown mutation safety not found")

    validate_block = re.search(
        r"VALIDATE_READY_FOR_EXPORT[\s\S]*?exportValidation:\s*\{[\s\S]*?\}\s*,[\s\S]*?\}\),",
        source,
    )
    if not validate_block:
        fail("VALIDATE_READY_FOR_EXPORT block not found")

    validate_source = validate_block.group(0).lower()
    assert_contains_all(
        validate_source,
        ["exportexecuted: false", "deployexecuted: false", "export_not_executed", "deploy_not_executed"],
        "VALIDATE_READY_FOR_EXPORT",
    )
    forbidden_runtime_tokens = ["github_export", "github_push", "deployexecuted: true", "exportexecuted: true"]
    found_forbidden = [token for token in forbidden_runtime_tokens if token in validate_source]
    if found_forbidden:
        fail(f"VALIDATE_READY_FOR_EXPORT contains forbidden runtime tokens: {found_forbidden}")


def validate_build_state(source: str) -> None:
    assert_contains_all(
        source,
        [
            "agentSpecId",
            "userFeedback",
            "statusMessage",
            "warnings",
            "blockers",
            "appliedActions",
            "trace",
            "mergeByKey(state.appliedActions",
            "mutationWarnings",
            "mutationBlockers",
        ],
        "BuilderBuildState",
    )


def validate_output_map(source: str) -> None:
    assert_contains_all(
        source,
        [
            "createExportValidationSnapshot",
            "feedback",
            "statusMessage",
            "warnings",
            "blockers",
            "readiness",
            "exportValidation",
            "summary",
            "agent",
        ],
        "BuilderOutputMap",
    )


def validate_forbidden_surface() -> None:
    edited_targets = [
        "tests/ai_base_chain_qa.py",
    ]
    for target in edited_targets:
        normalized = target.replace("\\", "/")
        if any(pattern in normalized for pattern in FORBIDDEN_PATH_PATTERNS):
            fail(f"forbidden surface touched by QA script target: {target}")


def main() -> int:
    specs = load_agent_specs()
    agentrail_source = read(AGENT_RAIL_PATH)
    registry_source = read(REGISTRY_PATH)
    build_state_source = read(BUILD_STATE_PATH)
    output_map_source = read(OUTPUT_MAP_PATH)

    agentrail_actions = extract_agentrail_actions(agentrail_source)
    mutation_types = extract_mutation_types(registry_source)

    validate_agent_contracts(specs, agentrail_actions)
    validate_registry(registry_source, mutation_types)
    validate_build_state(build_state_source)
    validate_output_map(output_map_source)
    validate_forbidden_surface()

    print("AI_BASE_CHAIN_QA_OK")
    print(f"agentrail_actions={len(agentrail_actions)}")
    print(f"mutation_types_validated={len(EXPECTED_MUTATION_TYPES)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"AI_BASE_CHAIN_QA_FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
