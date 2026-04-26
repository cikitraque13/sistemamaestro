"""
ai_analysis_decision_signals.py

Extracción de señales para la microfase algorítmica de decisión
del adaptador AI analysis.

Responsabilidades:
- normalizar input y lectura estructurada
- detectar señales booleanas para route y continuity
- devolver un bundle trazable con:
  - signals
  - active_signals
  - matched_phrases
  - text_bundle

No contiene:
- scoring
- precedencia
- desempates
- integración con ai_analysis.py

Regla de calibración v3:
- el input bruto decide la clase del caso
- el análisis generado solo ayuda a detectar qué falta definir
- una intención comercial genérica no activa sell por sí sola
- una idea comercial inmadura debe protegerse frente a sell + blueprint
"""

from __future__ import annotations

import re
import unicodedata
from typing import Any, Dict, Iterable, List, Tuple

from backend.app.services.ai_analysis_common import ensure_string
from backend.app.services.ai_analysis_decision_rules import (
    AUTOMATE_GOAL_PHRASES,
    AUTOMATION_LANGUAGE_PHRASES,
    CONVERSION_LANGUAGE_PHRASES,
    DEFINITION_PRESSURE_PHRASES,
    DIAGNOSTIC_LANGUAGE_PHRASES,
    EXECUTIVE_INTENSITY_PHRASES,
    EXISTING_OFFER_PHRASES,
    IDEA_GOAL_PHRASES,
    IMPROVE_GOAL_PHRASES,
    MULTILAYER_ARCHITECTURE_PHRASES,
    OFFER_LANGUAGE_PHRASES,
    OUTPUT_FORMAT_PHRASES,
    PRESENTATION_LANGUAGE_PHRASES,
    SELL_GOAL_PHRASES,
)

# ---------------------------------------------------------------------------
# Heurísticas auxiliares locales de signals.
# No forman parte del diccionario canónico de reglas de negocio,
# pero ayudan a detectar madurez, audiencia y presión de implementación.
# ---------------------------------------------------------------------------

AUDIENCE_LANGUAGE_PHRASES: Tuple[str, ...] = (
    "negocios",
    "empresas",
    "clientes",
    "usuarios",
    "equipo comercial",
    "prospectos",
    "leads",
    "webs",
    "sitios web",
    "procesos digitales",
)

IMPLEMENTATION_PRESSURE_PHRASES: Tuple[str, ...] = (
    "implementar",
    "implementacion",
    "integrar",
    "integracion",
    "desplegar",
    "deploy",
    "poner en marcha",
    "flujo",
    "pipeline",
    "motor",
    "builder",
)

SCOPE_DEFINITION_PHRASES: Tuple[str, ...] = (
    "alcance",
    "caso de uso",
    "foco inicial",
    "tipos de fricciones",
    "criterios de evaluacion",
    "criterios de clasificacion",
    "rol de la ia",
    "que parte hara la ia",
    "que parte hace la ia",
)

OUTPUT_DEFINITION_PHRASES: Tuple[str, ...] = (
    "formato de salida",
    "output de la herramienta",
    "output del sistema",
    "tipo de salida",
    "formato de las recomendaciones",
    "como se presentaran las recomendaciones",
    "como se presentaran las mejoras",
    "informe",
    "scoring",
    "checklist",
    "dashboard",
)

SYSTEM_DESIGN_PRESSURE_PHRASES: Tuple[str, ...] = (
    "arquitectura",
    "modulos",
    "capas",
    "flujos",
    "integraciones",
    "sistema completo",
    "multicapas",
    "builder",
    "motor",
)

PROBLEM_CLARITY_PHRASES: Tuple[str, ...] = (
    "fricciones de conversion",
    "clasificacion de leads",
    "respuestas iniciales",
    "cerrar mas clientes",
    "presento mi oferta",
    "diagnostico claro",
    "siguientes pasos",
    "auditoria web",
    "analice una web",
)

UTILITY_CLARITY_PHRASES: Tuple[str, ...] = (
    "herramienta",
    "sistema",
    "servicio",
    "oferta",
    "auditoria",
    "diagnostico",
    "clasificacion",
    "detectar",
    "analice",
    "analizar",
)


def _normalize_signal_text(value: Any) -> str:
    """
    Normaliza texto para matching robusto:
    - lower
    - sin acentos
    - sin puntuación relevante
    - espacios compactados
    """
    if not isinstance(value, str):
        return ""

    text = value.strip().lower()
    if not text:
        return ""

    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _flatten_strings(values: Iterable[Any]) -> List[str]:
    """
    Filtra y devuelve solo strings no vacíos.
    """
    cleaned: List[str] = []

    for value in values:
        if isinstance(value, str):
            stripped = value.strip()
            if stripped:
                cleaned.append(stripped)

    return cleaned


def _collect_analysis_fragments(normalized_result: Dict[str, Any]) -> List[str]:
    """
    Extrae fragmentos textuales útiles de la lectura estructurada ya generada.

    Importante:
    - no usa route actual
    - no usa continuity_recommendation.reason
    para evitar sesgo circular en la decisión.
    """
    diagnosis = normalized_result.get("diagnosis", {})
    if not isinstance(diagnosis, dict):
        diagnosis = {}

    executive_summary = diagnosis.get("executive_summary", {})
    if not isinstance(executive_summary, dict):
        executive_summary = {}

    core_diagnosis = diagnosis.get("core_diagnosis", {})
    if not isinstance(core_diagnosis, dict):
        core_diagnosis = {}

    immediate_action = diagnosis.get("immediate_action", {})
    if not isinstance(immediate_action, dict):
        immediate_action = {}

    fragments: List[str] = []
    fragments.extend(
        _flatten_strings(
            [
                diagnosis.get("summary"),
                diagnosis.get("understanding"),
                diagnosis.get("main_finding"),
                diagnosis.get("opportunity"),
                executive_summary.get("understanding"),
                executive_summary.get("main_tension"),
                executive_summary.get("commercial_importance"),
                executive_summary.get("bottom_line"),
                core_diagnosis.get("main_finding"),
                core_diagnosis.get("main_weakness"),
                core_diagnosis.get("main_leverage"),
                immediate_action.get("title"),
                immediate_action.get("description"),
            ]
        )
    )

    fragments.extend(_flatten_strings(diagnosis.get("strengths", [])))
    fragments.extend(_flatten_strings(diagnosis.get("weaknesses", [])))
    fragments.extend(_flatten_strings(diagnosis.get("quick_wins", [])))

    refine_questions = normalized_result.get("refine_questions", [])
    if isinstance(refine_questions, list):
        for item in refine_questions:
            if isinstance(item, dict):
                fragments.extend(_flatten_strings([item.get("question")]))

    return fragments


def _contains_any_phrase(text: str, phrases: Iterable[str]) -> Tuple[bool, List[str]]:
    """
    Devuelve si el texto contiene alguna frase y las frases detectadas.
    """
    matches: List[str] = []

    for phrase in phrases:
        normalized_phrase = _normalize_signal_text(phrase)
        if normalized_phrase and normalized_phrase in text:
            matches.append(normalized_phrase)

    deduped: List[str] = []
    seen = set()
    for item in matches:
        if item not in seen:
            seen.add(item)
            deduped.append(item)

    return bool(deduped), deduped


def _merge_hits(
    matched_phrases: Dict[str, List[str]],
    signal_name: str,
    source: str,
    hits: List[str],
) -> None:
    """
    Registra hits por señal con prefijo de fuente.
    """
    if not hits:
        return

    bucket = matched_phrases.setdefault(signal_name, [])
    for hit in hits:
        tagged = f"{source}:{hit}"
        if tagged not in bucket:
            bucket.append(tagged)


def _match_signal(
    signal_name: str,
    phrases: Iterable[str],
    input_text: str,
    analysis_text: str,
    matched_phrases: Dict[str, List[str]],
) -> Tuple[bool, bool]:
    """
    Detecta la misma familia de señal en input y análisis.
    """
    input_flag, input_hits = _contains_any_phrase(input_text, phrases)
    analysis_flag, analysis_hits = _contains_any_phrase(analysis_text, phrases)

    _merge_hits(matched_phrases, signal_name, "input", input_hits)
    _merge_hits(matched_phrases, signal_name, "analysis", analysis_hits)

    return input_flag, analysis_flag


def _active_signal_names(signals: Dict[str, bool]) -> List[str]:
    """
    Devuelve solo las señales activas, ordenadas por nombre.
    """
    return sorted([name for name, value in signals.items() if value])


def build_decision_signals(
    input_type: str,
    input_content: str,
    normalized_result: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Construye el bundle de señales para route y continuity.

    Devuelve:
    {
      "signals": {...},
      "active_signals": [...],
      "matched_phrases": {...},
      "text_bundle": {...}
    }
    """
    normalized_input_type = ensure_string(input_type, "text").lower()
    input_text = _normalize_signal_text(ensure_string(input_content, ""))
    analysis_fragments = _collect_analysis_fragments(normalized_result)
    analysis_text = _normalize_signal_text(" ".join(analysis_fragments))
    merged_text = _normalize_signal_text(" ".join([input_text, analysis_text]))

    matched_phrases: Dict[str, List[str]] = {}

    # ------------------------------------------------------------------
    # Matching base por familias de señal.
    # ------------------------------------------------------------------

    input_existing_offer, analysis_existing_offer = _match_signal(
        "has_existing_offer",
        EXISTING_OFFER_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_sell_goal, analysis_sell_goal = _match_signal(
        "goal_sell_present",
        SELL_GOAL_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_improve_goal, analysis_improve_goal = _match_signal(
        "goal_improve_present",
        IMPROVE_GOAL_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_automate_goal, analysis_automate_goal = _match_signal(
        "goal_automate_present",
        AUTOMATE_GOAL_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_idea_goal, analysis_idea_goal = _match_signal(
        "goal_idea_present",
        IDEA_GOAL_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_diagnostic_lang, analysis_diagnostic_lang = _match_signal(
        "diagnostic_language_present",
        DIAGNOSTIC_LANGUAGE_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_offer_lang, analysis_offer_lang = _match_signal(
        "offer_language_present",
        OFFER_LANGUAGE_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_automation_lang, analysis_automation_lang = _match_signal(
        "automation_language_present",
        AUTOMATION_LANGUAGE_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_conversion_lang, analysis_conversion_lang = _match_signal(
        "conversion_language_present",
        CONVERSION_LANGUAGE_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_presentation_lang, analysis_presentation_lang = _match_signal(
        "presentation_language_present",
        PRESENTATION_LANGUAGE_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_utility_clarity, analysis_utility_clarity = _match_signal(
        "_utility_clarity_present",
        UTILITY_CLARITY_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_problem_clarity, analysis_problem_clarity = _match_signal(
        "_problem_clarity_present",
        PROBLEM_CLARITY_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_output_format, analysis_output_format = _match_signal(
        "_output_format_present",
        OUTPUT_FORMAT_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_definition_pressure, analysis_definition_pressure = _match_signal(
        "_definition_pressure_present",
        DEFINITION_PRESSURE_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_scope_pressure, analysis_scope_pressure = _match_signal(
        "_scope_definition_present",
        SCOPE_DEFINITION_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_output_definition_pressure, analysis_output_definition_pressure = _match_signal(
        "_output_definition_present",
        OUTPUT_DEFINITION_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_multilayer, analysis_multilayer = _match_signal(
        "needs_multilayer_architecture",
        MULTILAYER_ARCHITECTURE_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_executive_intensity, analysis_executive_intensity = _match_signal(
        "executive_intensity_high",
        EXECUTIVE_INTENSITY_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_audience, analysis_audience = _match_signal(
        "audience_defined",
        AUDIENCE_LANGUAGE_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_impl_pressure, analysis_impl_pressure = _match_signal(
        "implementation_pressure_present",
        IMPLEMENTATION_PRESSURE_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    input_system_design, analysis_system_design = _match_signal(
        "system_design_pressure_present",
        SYSTEM_DESIGN_PRESSURE_PHRASES,
        input_text,
        analysis_text,
        matched_phrases,
    )

    # ------------------------------------------------------------------
    # Derivación final de señales.
    #
    # CALIBRACIÓN CLAVE:
    # - la naturaleza del caso la decide el input bruto
    # - el analysis_text solo ayuda a detectar faltas de definición
    # - una intención comercial genérica no debe activar sell por sí sola
    # - una idea comercial inmadura debe quedar protegida
    # ------------------------------------------------------------------

    url_mode_improve = normalized_input_type == "url"

    raw_sell_goal_present = input_sell_goal
    sell_context_present = (
        input_existing_offer
        or input_offer_lang
        or input_presentation_lang
    )

    ambiguity_high = (
        input_idea_goal
        and not (
            input_improve_goal
            or input_automate_goal
            or input_diagnostic_lang
            or input_automation_lang
            or input_problem_clarity
            or (raw_sell_goal_present and sell_context_present)
            or input_existing_offer
        )
    )

    immature_commercial_idea = (
        input_idea_goal
        and raw_sell_goal_present
        and not sell_context_present
        and not input_output_format
        and (ambiguity_high or not input_problem_clarity)
    )

    # ---------------------------
    # Señales estructurales ROUTE
    # ---------------------------

    has_existing_offer = input_existing_offer

    goal_sell_present = raw_sell_goal_present and sell_context_present and not immature_commercial_idea
    goal_improve_present = input_improve_goal or url_mode_improve
    goal_automate_present = input_automate_goal
    goal_idea_present = input_idea_goal

    diagnostic_language_present = input_diagnostic_lang or url_mode_improve
    offer_language_present = input_offer_lang
    automation_language_present = input_automation_lang
    conversion_language_present = input_conversion_lang
    presentation_language_present = input_presentation_lang

    has_clear_utility = (
        url_mode_improve
        or goal_sell_present
        or input_improve_goal
        or input_automate_goal
        or input_diagnostic_lang
        or input_automation_lang
        or input_problem_clarity
        or input_utility_clarity
        or (input_existing_offer and (goal_sell_present or input_conversion_lang or input_presentation_lang))
    )

    if immature_commercial_idea:
        has_clear_utility = False

    if ambiguity_high and not (goal_sell_present or input_improve_goal or input_automate_goal or url_mode_improve):
        has_clear_utility = False

    problem_defined = (
        url_mode_improve
        or input_problem_clarity
        or goal_sell_present
        or input_improve_goal
        or input_automate_goal
        or input_diagnostic_lang
        or input_automation_lang
        or (input_conversion_lang and not immature_commercial_idea)
    )

    if immature_commercial_idea:
        problem_defined = False

    output_defined = (
        input_output_format
        or ("diagnostico claro" in input_text)
        or ("prioridades" in input_text and "siguientes pasos" in input_text)
    )

    audience_defined = input_audience

    # -----------------------------------
    # Señales de definición / continuidad
    # -----------------------------------
    # Aquí sí permitimos apoyo del analysis_text porque esta capa
    # no cambia la naturaleza del caso, solo qué falta concretar.

    needs_definition_first = (
        ambiguity_high
        or immature_commercial_idea
        or not problem_defined
        or input_definition_pressure
        or analysis_definition_pressure
    )

    needs_output_definition = (
        not output_defined
        or input_output_definition_pressure
        or analysis_output_definition_pressure
    )

    needs_scope_definition = (
        ambiguity_high
        or immature_commercial_idea
        or not problem_defined
        or input_scope_pressure
        or analysis_scope_pressure
    )

    # -----------------------------------
    # Señales de intensidad alta
    # -----------------------------------
    # Deben ser conservadoras: solo input bruto.
    # -----------------------------------

    needs_multilayer_architecture = input_multilayer
    executive_intensity_high = input_executive_intensity

    implementation_pressure_present = (
        input_impl_pressure
        or automation_language_present
    )

    system_design_pressure_present = (
        input_system_design
        or needs_multilayer_architecture
    )

    signals: Dict[str, bool] = {
        # route
        "has_existing_offer": has_existing_offer,
        "has_clear_utility": has_clear_utility,
        "has_clear_utility_false": not has_clear_utility,
        "ambiguity_high": ambiguity_high,
        "goal_sell_present": goal_sell_present,
        "goal_improve_present": goal_improve_present,
        "goal_automate_present": goal_automate_present,
        "goal_idea_present": goal_idea_present,
        "immature_commercial_idea": immature_commercial_idea,
        "diagnostic_language_present": diagnostic_language_present,
        "offer_language_present": offer_language_present,
        "automation_language_present": automation_language_present,
        "conversion_language_present": conversion_language_present,
        "presentation_language_present": presentation_language_present,
        "output_defined": output_defined,
        "output_defined_false": not output_defined,
        "problem_defined": problem_defined,
        "problem_defined_false": not problem_defined,
        "audience_defined": audience_defined,
        # continuity
        "needs_definition_first": needs_definition_first,
        "needs_output_definition": needs_output_definition,
        "needs_scope_definition": needs_scope_definition,
        "needs_multilayer_architecture": needs_multilayer_architecture,
        "executive_intensity_high": executive_intensity_high,
        "implementation_pressure_present": implementation_pressure_present,
        "system_design_pressure_present": system_design_pressure_present,
    }

    return {
        "signals": signals,
        "active_signals": _active_signal_names(signals),
        "matched_phrases": matched_phrases,
        "text_bundle": {
            "input_type": normalized_input_type,
            "input_text": input_text,
            "analysis_text": analysis_text,
            "merged_text": merged_text,
        },
    }