from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional


BACKEND_DIR = Path(__file__).resolve().parents[2]
CREDITS_CONFIG_DIR = BACKEND_DIR / "config" / "credits"
CONTRACTS_DIR = CREDITS_CONFIG_DIR / "contracts"

ACTION_CATALOG_FILE = CREDITS_CONFIG_DIR / "action_catalog.json"
TIER_AMOUNTS_FILE = CREDITS_CONFIG_DIR / "tier_amounts.json"
THRESHOLD_RULES_FILE = CREDITS_CONFIG_DIR / "threshold_rules.json"
PLAN_LEVELS_FILE = CREDITS_CONFIG_DIR / "plan_levels.json"

CONSUMPTION_REQUEST_SCHEMA_FILE = CONTRACTS_DIR / "consumption_request.schema.json"
CONSUMPTION_RESPONSE_SCHEMA_FILE = CONTRACTS_DIR / "consumption_response.schema.json"


DEFAULT_ACTION_CATALOG: List[Dict[str, Any]] = []

DEFAULT_TIER_AMOUNTS: Dict[str, Any] = {
    "standard": {},
    "special": {},
    "multipliers": {
        "base": 1.0,
        "reinforced": 1.5,
        "intensive_t3": 2.0,
    },
}

DEFAULT_THRESHOLD_RULES: Dict[str, Any] = {
    "score_range": {
        "min": 1,
        "max": 4,
    },
    "repetition": {
        "medium_in_session": 3,
        "medium_on_project": 5,
        "intense_in_session": 5,
        "intense_on_project": 8,
    },
    "reinforced": {
        "critical_signals_min": 1,
        "high_signals_min": 2,
    },
    "escalated": {
        "critical_and_high": True,
        "high_signals_min": 3,
    },
    "special_credit": {
        "protected_action_keys": [
            "project_export",
            "project_deploy",
        ]
    },
}

DEFAULT_PLAN_LEVELS: Dict[str, int] = {
    "free": 0,
    "pro": 1,
    "growth": 2,
    "master": 3,
}

DEFAULT_CONSUMPTION_REQUEST_SCHEMA: Dict[str, Any] = {}
DEFAULT_CONSUMPTION_RESPONSE_SCHEMA: Dict[str, Any] = {}


def _read_json_file(path: Path, default: Any) -> Any:
    """
    Lee un JSON de configuración.
    - Si no existe, devuelve default.
    - Si existe pero está vacío, devuelve default.
    - Si existe y el JSON es inválido, lanza ValueError.
    """
    if not path.exists():
        return default

    raw = path.read_text(encoding="utf-8").strip()
    if not raw:
        return default

    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON in {path}") from exc


def _ensure_dict(value: Any, *, name: str) -> Dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError(f"{name} must be a JSON object")
    return value


def _ensure_list_of_dicts(value: Any, *, name: str) -> List[Dict[str, Any]]:
    if not isinstance(value, list):
        raise ValueError(f"{name} must be a JSON array")

    for index, item in enumerate(value):
        if not isinstance(item, dict):
            raise ValueError(f"{name}[{index}] must be a JSON object")

    return value


@lru_cache(maxsize=1)
def load_action_catalog() -> List[Dict[str, Any]]:
    data = _read_json_file(ACTION_CATALOG_FILE, DEFAULT_ACTION_CATALOG)
    return _ensure_list_of_dicts(data, name="action_catalog")


@lru_cache(maxsize=1)
def load_tier_amounts() -> Dict[str, Any]:
    data = _read_json_file(TIER_AMOUNTS_FILE, DEFAULT_TIER_AMOUNTS)
    return _ensure_dict(data, name="tier_amounts")


@lru_cache(maxsize=1)
def load_threshold_rules() -> Dict[str, Any]:
    data = _read_json_file(THRESHOLD_RULES_FILE, DEFAULT_THRESHOLD_RULES)
    return _ensure_dict(data, name="threshold_rules")


@lru_cache(maxsize=1)
def load_plan_levels() -> Dict[str, int]:
    data = _read_json_file(PLAN_LEVELS_FILE, DEFAULT_PLAN_LEVELS)
    data = _ensure_dict(data, name="plan_levels")

    normalized: Dict[str, int] = {}
    for key, value in data.items():
        if not isinstance(key, str):
            raise ValueError("plan_levels keys must be strings")
        if not isinstance(value, int):
            raise ValueError(f"plan_levels['{key}'] must be an integer")
        normalized[key] = value

    return normalized


@lru_cache(maxsize=1)
def load_consumption_request_schema() -> Dict[str, Any]:
    data = _read_json_file(
        CONSUMPTION_REQUEST_SCHEMA_FILE,
        DEFAULT_CONSUMPTION_REQUEST_SCHEMA,
    )
    return _ensure_dict(data, name="consumption_request_schema")


@lru_cache(maxsize=1)
def load_consumption_response_schema() -> Dict[str, Any]:
    data = _read_json_file(
        CONSUMPTION_RESPONSE_SCHEMA_FILE,
        DEFAULT_CONSUMPTION_RESPONSE_SCHEMA,
    )
    return _ensure_dict(data, name="consumption_response_schema")


def get_action_config(action_key: str) -> Optional[Dict[str, Any]]:
    if not action_key:
        return None

    for action in load_action_catalog():
        if action.get("action_key") == action_key:
            return action

    return None


def get_plan_level(plan_name: str) -> Optional[int]:
    if not plan_name:
        return None
    return load_plan_levels().get(plan_name)


def has_required_plan(user_plan: str, required_plan: str) -> bool:
    """
    Devuelve True si user_plan cumple o supera required_plan.
    Si required_plan es vacío o 'free', se considera permitido.
    """
    if not required_plan or required_plan == "free":
        return True

    user_level = get_plan_level(user_plan)
    required_level = get_plan_level(required_plan)

    if user_level is None or required_level is None:
        return False

    return user_level >= required_level


def get_credits_config_bundle() -> Dict[str, Any]:
    """
    Devuelve toda la configuración consolidada.
    Útil para servicios, simulación y diagnóstico.
    """
    return {
        "action_catalog": load_action_catalog(),
        "tier_amounts": load_tier_amounts(),
        "threshold_rules": load_threshold_rules(),
        "plan_levels": load_plan_levels(),
        "contracts": {
            "consumption_request": load_consumption_request_schema(),
            "consumption_response": load_consumption_response_schema(),
        },
        "paths": {
            "credits_config_dir": str(CREDITS_CONFIG_DIR),
            "contracts_dir": str(CONTRACTS_DIR),
            "action_catalog_file": str(ACTION_CATALOG_FILE),
            "tier_amounts_file": str(TIER_AMOUNTS_FILE),
            "threshold_rules_file": str(THRESHOLD_RULES_FILE),
            "plan_levels_file": str(PLAN_LEVELS_FILE),
            "consumption_request_schema_file": str(CONSUMPTION_REQUEST_SCHEMA_FILE),
            "consumption_response_schema_file": str(CONSUMPTION_RESPONSE_SCHEMA_FILE),
        },
    }


def clear_credits_config_cache() -> None:
    """
    Limpia caché en caliente.
    Útil si luego quieres recargar JSONs sin reiniciar.
    """
    load_action_catalog.cache_clear()
    load_tier_amounts.cache_clear()
    load_threshold_rules.cache_clear()
    load_plan_levels.cache_clear()
    load_consumption_request_schema.cache_clear()
    load_consumption_response_schema.cache_clear()
