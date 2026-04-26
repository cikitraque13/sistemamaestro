"""
semantic_admission_decision.py

Scoring, precedencias, guardrails, confianza y politica de pregunta
unica para la Capa de Admision Semantica v1.

Responsabilidades:
- calcular scores de:
  - input_nature
  - user_intent
  - maturity_level
- aplicar precedencias
- aplicar guardrails
- calcular confidence
- decidir si necesita una sola aclaracion
- construir el payload canonico de admision

No contiene:
- normalizacion de texto
- extraccion de senales
- integracion con ai_analysis.py
- diagnostico final del analisis
"""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

from backend.app.services.ai_analysis_common import ensure_string
from backend.app.services.semantic_admission_rules import (
    ALLOWED_CONFIDENCE_LEVELS,
    ALLOWED_INPUT_NATURES,
    ALLOWED_MATURITY_LEVELS,
    ALLOWED_USER_INTENTS,
    HIGH_CONFIDENCE_DELTA,
    INPUT_NATURE_PRECEDENCE_ORDER,
    INPUT_NATURE_WEIGHTS,
    LOW_CONFIDENCE_MAX_DELTA,
    MATURITY_LEVEL_WEIGHTS,
    MATURITY_PRECEDENCE_ORDER,
    MAX_TEXT_CLARIFICATION_WORDS,
    MAX_VOICE_CLARIFICATION_WORDS,
    MEDIUM_CONFIDENCE_DELTA,
    PRECEDENCE_RULES,
    SEMANTIC_ADMISSION_GUARDRAILS,
    TEXT_CLARIFICATION_TEMPLATES,
    USER_INTENT_PRECEDENCE_ORDER,
    USER_INTENT_WEIGHTS,
    VOICE_CLARIFICATION_TEMPLATES,
)


def _score_labels(
    label_weights: Dict[str, Dict[str, int]],
    signals: Dict[str, bool],
) -> Tuple[Dict[str, int], Dict[str, List[str]]]:
    """
    Calcula score por etiqueta y deja trazabilidad minima
    de que senales aportaron puntos.
    """
    scores: Dict[str, int] = {}
    contributions: Dict[str, List[str]] = {}

    for label, weights in label_weights.items():
        total = 0
        hits: List[str] = []

        for signal_name, weight in weights.items():
            if signals.get(signal_name, False):
                total += weight
                hits.append(f"{signal_name}:{weight}")

        scores[label] = total
        contributions[label] = hits

    return scores, contributions


def _labels_with_max_score(scores: Dict[str, int]) -> List[str]:
    """
    Devuelve las etiquetas con la maxima puntuacion.
    """
    if not scores:
        return []

    max_score = max(scores.values())
    return sorted([label for label, value in scores.items() if value == max_score])


def _sorted_positive_scores(scores: Dict[str, int]) -> List[Tuple[str, int]]:
    """
    Devuelve labels positivas ordenadas de mayor a menor score.
    """
    items = [(label, value) for label, value in scores.items() if value > 0]
    items.sort(key=lambda x: (-x[1], x[0]))
    return items


def _pick_by_precedence(
    labels: Iterable[str],
    precedence_order: Sequence[str],
) -> Optional[str]:
    """
    Elige la primera etiqueta presente segun precedencia.
    """
    label_set = set(labels)
    for label in precedence_order:
        if label in label_set:
            return label
    return None


def _top_two_delta(scores: Dict[str, int]) -> int:
    """
    Diferencia entre el primer y segundo score positivo.
    """
    ordered = _sorted_positive_scores(scores)
    if not ordered:
        return 0
    if len(ordered) == 1:
        return ordered[0][1]
    return ordered[0][1] - ordered[1][1]


def _top_labels(scores: Dict[str, int], limit: int = 3) -> List[str]:
    """
    Devuelve labels positivas ordenadas.
    """
    return [label for label, _ in _sorted_positive_scores(scores)[:limit]]


def _resolve_input_nature_candidate(
    nature_scores: Dict[str, int],
    signals: Dict[str, bool],
) -> str:
    """
    Resuelve el candidato preliminar de input_nature.
    """
    top_labels = _labels_with_max_score(nature_scores)

    if not top_labels or max(nature_scores.values(), default=0) <= 0:
        if signals.get("idea_signal") or signals.get("validation_signal"):
            return "idea_validation"
        if signals.get("feature_density_signal") or signals.get("benefit_density_signal"):
            return "product_description"
        return "mixed_input"

    if len(top_labels) == 1:
        return top_labels[0]

    return _pick_by_precedence(top_labels, INPUT_NATURE_PRECEDENCE_ORDER) or "mixed_input"


def _resolve_user_intent_candidate(
    intent_scores: Dict[str, int],
    signals: Dict[str, bool],
) -> str:
    """
    Resuelve el candidato preliminar de user_intent.
    """
    top_labels = _labels_with_max_score(intent_scores)

    if not top_labels or max(intent_scores.values(), default=0) <= 0:
        if signals.get("validation_signal") or signals.get("idea_signal") or signals.get("uncertainty_signal"):
            return "validate_this"
        return "unclear"

    if len(top_labels) == 1:
        return top_labels[0]

    return _pick_by_precedence(top_labels, USER_INTENT_PRECEDENCE_ORDER) or "unclear"


def _resolve_maturity_candidate(
    maturity_scores: Dict[str, int],
    signals: Dict[str, bool],
) -> str:
    """
    Resuelve el candidato preliminar de maturity_level.
    """
    top_labels = _labels_with_max_score(maturity_scores)

    if not top_labels or max(maturity_scores.values(), default=0) <= 0:
        if signals.get("existing_offer_signal"):
            return "existing_offer"
        if signals.get("feature_density_signal") or signals.get("output_defined_signal"):
            return "defined_solution"
        if signals.get("idea_signal") or signals.get("validation_signal") or signals.get("uncertainty_signal"):
            return "early_idea"
        return "concept_in_definition"

    if len(top_labels) == 1:
        return top_labels[0]

    return _pick_by_precedence(top_labels, MATURITY_PRECEDENCE_ORDER) or "concept_in_definition"


def _commercial_context_present(signals: Dict[str, bool]) -> bool:
    """
    Determina si existe un contexto comercial/oferta suficientemente fuerte.
    """
    return any(
        [
            signals.get("existing_offer_signal"),
            signals.get("offer_language_signal"),
            signals.get("presentation_signal"),
            signals.get("positioning_signal"),
        ]
    )


def _mark_mixed_input_if_needed(
    input_nature: str,
    nature_scores: Dict[str, int],
    triggered: List[str],
) -> str:
    """
    Marca mixed_input cuando hay colision fuerte entre naturalezas.
    """
    ordered = _sorted_positive_scores(nature_scores)
    if len(ordered) < 2:
        return input_nature

    top_1, score_1 = ordered[0]
    top_2, score_2 = ordered[1]
    delta = score_1 - score_2
    pair = frozenset([top_1, top_2])

    conflicting_pairs = {
        frozenset(["service_offer", "system_concept"]),
        frozenset(["service_offer", "automation_flow"]),
        frozenset(["service_offer", "audit_request"]),
        frozenset(["product_description", "service_offer"]),
        frozenset(["system_concept", "automation_flow"]),
        frozenset(["idea_validation", "service_offer"]),
        frozenset(["idea_validation", "system_concept"]),
    }

    if score_1 >= 3 and delta <= 1 and pair in conflicting_pairs:
        if "mixed_high_scores_require_clarification" in SEMANTIC_ADMISSION_GUARDRAILS:
            triggered.append("mixed_high_scores_require_clarification")
        return "mixed_input"

    return input_nature


def _apply_input_nature_guardrails(
    input_nature_candidate: str,
    nature_scores: Dict[str, int],
    signals: Dict[str, bool],
) -> Tuple[str, List[str]]:
    """
    Aplica guardrails sobre input_nature.
    """
    final_nature = input_nature_candidate
    triggered: List[str] = []

    final_nature = _mark_mixed_input_if_needed(final_nature, nature_scores, triggered)

    if (
        final_nature == "service_offer"
        and signals.get("automation_signal")
        and (signals.get("flow_signal") or signals.get("ops_signal") or signals.get("integration_signal"))
    ):
        final_nature = "automation_flow"

    if (
        final_nature == "service_offer"
        and (signals.get("diagnostic_signal") or signals.get("audit_signal"))
        and (signals.get("friction_signal") or signals.get("improvement_signal"))
    ):
        final_nature = "audit_request"

    if (
        not signals.get("existing_offer_signal")
        and (signals.get("validation_signal") or signals.get("idea_signal") or signals.get("uncertainty_signal"))
        and final_nature in {"service_offer", "product_description"}
    ):
        final_nature = "idea_validation"

    if final_nature not in ALLOWED_INPUT_NATURES:
        final_nature = "mixed_input"

    return final_nature, triggered


def _apply_user_intent_guardrails(
    user_intent_candidate: str,
    input_nature: str,
    maturity_level: str,
    intent_scores: Dict[str, int],
    signals: Dict[str, bool],
) -> Tuple[str, List[str]]:
    """
    Aplica guardrails sobre user_intent.
    """
    final_intent = user_intent_candidate
    triggered: List[str] = []

    commercial_context = _commercial_context_present(signals)

    if (
        final_intent == "sell_this"
        and signals.get("feature_density_signal")
        and signals.get("benefit_density_signal")
        and not commercial_context
    ):
        final_intent = "unclear"
        if "rich_description_is_not_sell" in SEMANTIC_ADMISSION_GUARDRAILS:
            triggered.append("rich_description_is_not_sell")

    if (
        final_intent == "position_this"
        and signals.get("premium_signal")
        and not (
            signals.get("existing_offer_signal")
            or signals.get("positioning_signal")
            or signals.get("presentation_signal")
        )
    ):
        final_intent = "unclear"
        if "premium_language_is_not_premium_intent" in SEMANTIC_ADMISSION_GUARDRAILS:
            triggered.append("premium_language_is_not_premium_intent")

    if (
        final_intent in {"sell_this", "position_this"}
        and not signals.get("existing_offer_signal")
        and (signals.get("validation_signal") or signals.get("idea_signal") or signals.get("uncertainty_signal"))
    ):
        final_intent = "validate_this"
        if "validation_blocks_sell_without_existing_offer" in SEMANTIC_ADMISSION_GUARDRAILS:
            triggered.append("validation_blocks_sell_without_existing_offer")

    if (
        final_intent in {"sell_this", "position_this"}
        and signals.get("automation_signal")
        and (signals.get("flow_signal") or signals.get("ops_signal") or signals.get("integration_signal"))
    ):
        final_intent = "automate_this"
        if "automation_blocks_sell_when_ops_core_is_dominant" in SEMANTIC_ADMISSION_GUARDRAILS:
            triggered.append("automation_blocks_sell_when_ops_core_is_dominant")

    if (
        final_intent in {"sell_this", "position_this"}
        and (signals.get("diagnostic_signal") or signals.get("audit_signal"))
        and (signals.get("friction_signal") or signals.get("improvement_signal") or signals.get("output_defined_signal"))
    ):
        final_intent = "diagnose_this"
        if "diagnostic_blocks_sell_when_audit_core_is_dominant" in SEMANTIC_ADMISSION_GUARDRAILS:
            triggered.append("diagnostic_blocks_sell_when_audit_core_is_dominant")

    if (
        maturity_level == "early_idea"
        and final_intent in {"sell_this", "position_this"}
        and not signals.get("existing_offer_signal")
    ):
        final_intent = "validate_this"
        if "early_idea_with_commercial_language_requires_disambiguation" in SEMANTIC_ADMISSION_GUARDRAILS:
            triggered.append("early_idea_with_commercial_language_requires_disambiguation")

    if input_nature == "automation_flow" and final_intent in {"sell_this", "position_this"}:
        final_intent = "automate_this"

    if input_nature == "audit_request" and final_intent in {"sell_this", "position_this"}:
        final_intent = "diagnose_this"

    if input_nature == "idea_validation" and final_intent in {"sell_this", "position_this"} and not signals.get("existing_offer_signal"):
        final_intent = "validate_this"

    if max(intent_scores.values(), default=0) <= 0 and final_intent not in {"validate_this"}:
        final_intent = "unclear"

    if final_intent not in ALLOWED_USER_INTENTS:
        final_intent = "unclear"

    return final_intent, triggered


def _apply_maturity_guardrails(
    maturity_candidate: str,
    signals: Dict[str, bool],
) -> str:
    """
    Aplica guardrails minimos sobre maturity_level.
    """
    final_maturity = maturity_candidate

    if signals.get("existing_offer_signal"):
        final_maturity = "existing_offer"

    elif signals.get("validation_signal") or (
        signals.get("idea_signal")
        and (signals.get("uncertainty_signal") or signals.get("format_missing_signal"))
    ):
        final_maturity = "early_idea"

    elif signals.get("feature_density_signal") or signals.get("output_defined_signal"):
        final_maturity = "defined_solution"

    if final_maturity not in ALLOWED_MATURITY_LEVELS:
        final_maturity = "concept_in_definition"

    return final_maturity


def _apply_cross_guardrails(
    input_nature: str,
    user_intent: str,
    maturity_level: str,
    signals: Dict[str, bool],
) -> Tuple[str, str, str, List[str]]:
    """
    Aplica guardrails transversales que afectan a varias dimensiones.
    """
    final_nature = input_nature
    final_intent = user_intent
    final_maturity = maturity_level
    triggered: List[str] = []

    # existing_offer exige senal real de oferta existente.
    if final_maturity == "existing_offer" and not signals.get("existing_offer_signal"):
        final_maturity = "concept_in_definition"
        if "existing_offer_requires_existing_offer_signal" in SEMANTIC_ADMISSION_GUARDRAILS:
            triggered.append("existing_offer_requires_existing_offer_signal")

    # Mezcla validate/build sin oferta existente:
    # debe mantenerse como idea_validation + validate_this + early_idea.
    if (
        signals.get("mixed_intent_signal")
        and signals.get("explicit_validate_intent_signal")
        and not signals.get("existing_offer_signal")
    ):
        final_nature = "idea_validation"
        final_intent = "validate_this"
        final_maturity = "early_idea"
        if "mixed_validate_build_requires_clarification" in SEMANTIC_ADMISSION_GUARDRAILS:
            triggered.append("mixed_validate_build_requires_clarification")

    # Mezcla build/sell sin validate:
    if (
        signals.get("mixed_intent_signal")
        and signals.get("explicit_build_intent_signal")
        and signals.get("explicit_sell_intent_signal")
        and not signals.get("explicit_validate_intent_signal")
    ):
        final_nature = "mixed_input"
        final_intent = "unclear"
        if not signals.get("existing_offer_signal"):
            final_maturity = "concept_in_definition"
        if "mixed_build_sell_requires_clarification" in SEMANTIC_ADMISSION_GUARDRAILS:
            triggered.append("mixed_build_sell_requires_clarification")

    # Naturaleza fuerte sin intencion explicita:
    if signals.get("strong_nature_without_explicit_intent_signal"):
        final_nature = "mixed_input"
        final_intent = "unclear"
        if "strong_nature_without_explicit_intent_requires_clarification" in SEMANTIC_ADMISSION_GUARDRAILS:
            triggered.append("strong_nature_without_explicit_intent_requires_clarification")

    return final_nature, final_intent, final_maturity, triggered


def _calculate_confidence(
    input_mode: str,
    input_nature: str,
    user_intent: str,
    maturity_level: str,
    nature_scores: Dict[str, int],
    intent_scores: Dict[str, int],
    triggered_guardrails: Sequence[str],
    signals: Dict[str, bool],
) -> str:
    """
    Calcula nivel de confianza final.
    """
    intent_delta = _top_two_delta(intent_scores)
    nature_delta = _top_two_delta(nature_scores)

    blocking_guardrails = {
        "mixed_high_scores_require_clarification",
        "low_confidence_requires_single_question",
        "early_idea_with_commercial_language_requires_disambiguation",
        "strong_nature_without_explicit_intent_requires_clarification",
        "mixed_build_sell_requires_clarification",
        "mixed_validate_build_requires_clarification",
    }

    has_blocking_guardrail = any(item in blocking_guardrails for item in triggered_guardrails)

    if user_intent == "unclear" or input_nature == "mixed_input":
        confidence = "low"

    elif has_blocking_guardrail:
        confidence = "low"

    elif intent_delta >= HIGH_CONFIDENCE_DELTA and nature_delta >= MEDIUM_CONFIDENCE_DELTA:
        confidence = "high"

    elif intent_delta >= MEDIUM_CONFIDENCE_DELTA:
        confidence = "medium"

    elif intent_delta <= LOW_CONFIDENCE_MAX_DELTA:
        confidence = "low"

    else:
        confidence = "medium"

    if (
        input_mode == "voice_transcript"
        and confidence == "high"
        and (
            signals.get("spoken_disfluency_signal")
            or signals.get("fragmented_sentence_signal")
            or signals.get("self_correction_signal")
        )
    ):
        confidence = "medium"

    if confidence not in ALLOWED_CONFIDENCE_LEVELS:
        confidence = "low"

    return confidence


def _limit_question_words(question: str, max_words: int) -> str:
    """
    Limita pregunta a numero maximo de palabras.
    """
    question = ensure_string(question, "").strip()
    if not question:
        return ""

    words = question.split()
    if len(words) <= max_words:
        return question

    trimmed = " ".join(words[:max_words]).rstrip(" ,.;:")
    if not trimmed.endswith("?"):
        trimmed += "?"
    return trimmed


def _select_clarification_template_key(
    input_nature: str,
    maturity_level: str,
    top_intents: Sequence[str],
) -> str:
    """
    Selecciona la plantilla mas adecuada para una sola pregunta.
    """
    top_set = set(top_intents)

    if {"automate_this", "sell_this"} & top_set and "automate_this" in top_set:
        return "automation_vs_sell"

    if {"diagnose_this", "sell_this"} & top_set and "diagnose_this" in top_set:
        return "diagnostic_vs_sell"

    if {"build_this", "sell_this"} & top_set and "build_this" in top_set:
        return "system_vs_sell"

    if maturity_level == "early_idea" or input_nature == "idea_validation":
        return "idea_early"

    if input_nature in {"service_offer", "product_description"}:
        return "offer_without_intent"

    return "generic"


def _build_clarification_question(
    input_mode: str,
    input_nature: str,
    maturity_level: str,
    intent_scores: Dict[str, int],
) -> str:
    """
    Construye una sola pregunta de aclaracion.
    """
    top_intents = _top_labels(intent_scores, limit=3)
    template_key = _select_clarification_template_key(
        input_nature=input_nature,
        maturity_level=maturity_level,
        top_intents=top_intents,
    )

    is_voice = input_mode == "voice_transcript"
    template_map = VOICE_CLARIFICATION_TEMPLATES if is_voice else TEXT_CLARIFICATION_TEMPLATES
    question = template_map.get(template_key) or template_map.get("generic", "")

    max_words = MAX_VOICE_CLARIFICATION_WORDS if is_voice else MAX_TEXT_CLARIFICATION_WORDS
    return _limit_question_words(question, max_words)


def build_semantic_admission_decision(
    input_mode: str,
    normalized_text: str,
    signals_bundle: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Construye el payload canonico de admision semantica.
    """
    resolved_input_mode = ensure_string(input_mode, "text").strip().lower()
    normalized_text = ensure_string(normalized_text, "").strip()

    signals_bundle = signals_bundle if isinstance(signals_bundle, dict) else {}
    signals = signals_bundle.get("signals", {})
    signals = signals if isinstance(signals, dict) else {}

    active_signals = signals_bundle.get("active_signals", [])
    if not isinstance(active_signals, list):
        active_signals = []

    matched_phrases = signals_bundle.get("matched_phrases", {})
    if not isinstance(matched_phrases, dict):
        matched_phrases = {}

    text_bundle = signals_bundle.get("text_bundle", {})
    if not isinstance(text_bundle, dict):
        text_bundle = {}

    nature_scores, nature_score_details = _score_labels(INPUT_NATURE_WEIGHTS, signals)
    intent_scores, intent_score_details = _score_labels(USER_INTENT_WEIGHTS, signals)
    maturity_scores, maturity_score_details = _score_labels(MATURITY_LEVEL_WEIGHTS, signals)

    input_nature_candidate = _resolve_input_nature_candidate(nature_scores, signals)
    maturity_candidate = _resolve_maturity_candidate(maturity_scores, signals)
    maturity_level = _apply_maturity_guardrails(maturity_candidate, signals)

    input_nature, nature_guardrails = _apply_input_nature_guardrails(
        input_nature_candidate=input_nature_candidate,
        nature_scores=nature_scores,
        signals=signals,
    )

    user_intent_candidate = _resolve_user_intent_candidate(intent_scores, signals)
    user_intent, intent_guardrails = _apply_user_intent_guardrails(
        user_intent_candidate=user_intent_candidate,
        input_nature=input_nature,
        maturity_level=maturity_level,
        intent_scores=intent_scores,
        signals=signals,
    )

    triggered_guardrails: List[str] = []
    for item in nature_guardrails + intent_guardrails:
        if item not in triggered_guardrails:
            triggered_guardrails.append(item)

    input_nature, user_intent, maturity_level, cross_guardrails = _apply_cross_guardrails(
        input_nature=input_nature,
        user_intent=user_intent,
        maturity_level=maturity_level,
        signals=signals,
    )

    for item in cross_guardrails:
        if item not in triggered_guardrails:
            triggered_guardrails.append(item)

    confidence = _calculate_confidence(
        input_mode=resolved_input_mode,
        input_nature=input_nature,
        user_intent=user_intent,
        maturity_level=maturity_level,
        nature_scores=nature_scores,
        intent_scores=intent_scores,
        triggered_guardrails=triggered_guardrails,
        signals=signals,
    )

    guardrail_forced_clarification = any(
        item in {
            "strong_nature_without_explicit_intent_requires_clarification",
            "mixed_build_sell_requires_clarification",
            "mixed_validate_build_requires_clarification",
            "mixed_high_scores_require_clarification",
        }
        for item in triggered_guardrails
    )

    needs_clarification = (
        confidence == "low"
        or input_nature == "mixed_input"
        or user_intent == "unclear"
        or guardrail_forced_clarification
    )

    if needs_clarification and "low_confidence_requires_single_question" in SEMANTIC_ADMISSION_GUARDRAILS:
        if "low_confidence_requires_single_question" not in triggered_guardrails:
            triggered_guardrails.append("low_confidence_requires_single_question")

    clarification_question = ""
    if needs_clarification:
        clarification_question = _build_clarification_question(
            input_mode=resolved_input_mode,
            input_nature=input_nature,
            maturity_level=maturity_level,
            intent_scores=intent_scores,
        )

    status = "clarification_required" if needs_clarification else "ready_for_analysis"

    payload: Dict[str, Any] = {
        "status": status,
        "ready_for_analysis": not needs_clarification,
        "input_mode": resolved_input_mode,
        "normalized_text": normalized_text,
        "input_nature": input_nature,
        "user_intent": user_intent,
        "maturity_level": maturity_level,
        "confidence": confidence,
        "needs_clarification": needs_clarification,
        "clarification_question": clarification_question,
        "active_signals": active_signals,
        "scores": {
            "input_nature": nature_scores,
            "user_intent": intent_scores,
            "maturity_level": maturity_scores,
        },
        "score_details": {
            "input_nature": nature_score_details,
            "user_intent": intent_score_details,
            "maturity_level": maturity_score_details,
        },
        "guardrails_triggered": triggered_guardrails,
        "matched_phrases": matched_phrases,
        "text_bundle": text_bundle,
        "precedence_rules": PRECEDENCE_RULES,
    }

    return payload