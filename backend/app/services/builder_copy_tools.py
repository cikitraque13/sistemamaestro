"""Strict tool schema for the Claude copy executor.

The provider schema and the server check are the same shape. Invented
fields are dropped when the rest is valid, and a bad enum or a missing
required field is rejected without echoing the value.
"""
from backend.app.services.builder_system_prompt import SECTION_ROLES

TOOL_NAME = "submit_landing_copy"
_SECTION_KEYS = ("title", "text", "role")
_TOP_KEYS = ("title", "subtitle", "cta", "sections")

INPUT_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["title", "subtitle", "cta", "sections"],
    "properties": {
        "title": {"type": "string"},
        "subtitle": {"type": "string"},
        "cta": {"type": "string"},
        "sections": {
            "type": "array",
            "minItems": 1,
            "maxItems": 6,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["title", "text", "role"],
                "properties": {
                    "title": {"type": "string"},
                    "text": {"type": "string"},
                    "role": {"type": "string", "enum": list(SECTION_ROLES)},
                },
            },
        },
    },
}


def tool_definition() -> dict:
    return {
        "name": TOOL_NAME,
        "description": "Entrega el texto visible de la landing. Sin HTML y sin campos extra.",
        "strict": True,
        "input_schema": INPUT_SCHEMA,
        "cache_control": {"type": "ephemeral"},
    }


def _names(keys, allowed):
    return sorted(str(key) for key in keys if key not in allowed)


def validate_tool_input(payload):
    """Return (cleaned, errors). errors is empty when the input is usable.

    Unknown keys are removed. A missing required field or a role outside the
    enum rejects the call. Error strings name the field, not the value.
    """
    if not isinstance(payload, dict):
        return None, ["type"]
    errors = []
    invented = _names(payload.keys(), _TOP_KEYS)
    if invented:
        errors.append("invented:" + ",".join(invented))
    cleaned = {}
    for key in ("title", "subtitle", "cta"):
        value = payload.get(key)
        if not isinstance(value, str) or not value.strip():
            errors.append("missing:" + key)
        else:
            cleaned[key] = value
    sections = payload.get("sections")
    if not isinstance(sections, list) or not sections or len(sections) > 6:
        errors.append("missing:sections")
        sections = []
    cleaned_sections = []
    for index, item in enumerate(sections):
        if not isinstance(item, dict):
            errors.append(f"missing:sections.{index}")
            continue
        extra = _names(item.keys(), _SECTION_KEYS)
        if extra:
            errors.append(f"invented:sections.{index}." + ",".join(extra))
        section = {}
        for key in ("title", "text"):
            value = item.get(key)
            if not isinstance(value, str) or not value.strip():
                errors.append(f"missing:sections.{index}.{key}")
            else:
                section[key] = value
        role = item.get("role")
        if role not in SECTION_ROLES:
            errors.append(f"enum:sections.{index}.role")
        else:
            section["role"] = role
        if len(section) == 3:
            cleaned_sections.append(section)
    if cleaned_sections:
        cleaned["sections"] = cleaned_sections
    blocking = [item for item in errors if not item.startswith("invented:")]
    if blocking or "sections" not in cleaned or any(key not in cleaned for key in ("title", "subtitle", "cta")):
        return None, errors
    return cleaned, [item for item in errors if item.startswith("invented:")]
