"""
ai_analysis_decision.py

Motor algorítmico de decisión para la microfase route + continuity
del adaptador AI analysis.

Responsabilidades:
- construir bundle de decisión a partir de:
  - input bruto
  - resultado normalizado del adaptador
- calcular scores de route y continuity
- aplicar precedencia
- aplicar desempates
- aplicar guardrails
- producir una salida trazable
- ofrecer una función pura para aplicar la decisión al resultado normalizado

No contiene:
- integración con ai_analysis.py
- llamadas a proveedor
- normalización semántica del diagnosis
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, Iterable, List, Optional, Tuple

from backend.app.services.ai_analysis_common import (
    ALLOWED_CONTINUITY_PATHS,
    ensure_string,
    normalize_route,
)
from backend.app.services.ai_analysis_decision_rules import (
    CONTINUITY_DEFAULT_CTA_BY_PATH,
    CONTINUITY_GUARDRAILS,
    CONTINUITY_PRECEDENCE_ORDER,
    CONTINUITY_SIGNAL_WEIGHTS,
    CONTINUITY_TIEBREAKERS,
    ROUTE_GUARDRAILS,
    ROUTE_PRECEDENCE_ORDER,
    ROUTE_SIGNAL_WEIGHTS,
    ROUTE_TIEBREAKERS,
)
from backend.app.services.ai_analysis_decision_signals import build_decision_signals


def _score_labels(
    label_weights: Dict[str, Dict[str, int]],
    signals: Dict[str, bool],
) -> Tuple[Dict[str, int], Dict[str, List[str]]]:
    """
    Calcula score por etiqueta y deja trazabilidad mínima
    de qué señales aportaron puntos.
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
    Devuelve las etiquetas con la máxima puntuación.
    """
    if not scores:
        return []

    max_score = max(scores.values())
    return sorted([label for label, value in scores.items() if value == max_score])


def _pick_by_precedence(
    labels: Iterable[str],
    precedence_order: Iterable[str],
) -> Optional[str]:
    """
    Devuelve la primera etiqueta presente según precedencia.
    """
    label_set = set(labels)
    for label in precedence_order:
        if label in label_set:
            return label
    return None


def _resolve_route_candidate(
    route_scores: Dict[str, int],
    signals: Dict[str, bool],
) -> Tuple[str, Optional[str]]:
    """
    Resuelve candidato preliminar de route usando scores y desempates.
    """
    top_labels = _labels_with_max_score(route_scores)
    if not top_labels:
        return "idea", None

    if len(top_labels) == 1:
        return top_labels[0], None

    top_set = set(top_labels)

    if {"sell", "improve"}.issubset(top_set):
        if signals.get("has_existing_offer") and signals.get("goal_sell_present"):
            return "sell", "sell_vs_improve"
        if signals.get("diagnostic_language_present") and not signals.get("goal_sell_present"):
            return "improve", "sell_vs_improve"
        return _pick_by_precedence(top_labels, ROUTE_PRECEDENCE_ORDER) or "improve", "sell_vs_improve"

    if {"improve", "idea"}.issubset(top_set):
        if signals.get("has_clear_utility"):
            return "improve", "improve_vs_idea"
        return "idea", "improve_vs_idea"

    if {"automate", "improve"}.issubset(top_set):
        if signals.get("goal_automate_present") and signals.get("automation_language_present"):
            return "automate", "automate_vs_improve"
        if signals.get("diagnostic_language_present") and not signals.get("goal_automate_present"):
            return "improve", "automate_vs_improve"
        return _pick_by_precedence(top_labels, ROUTE_PRECEDENCE_ORDER) or "automate", "automate_vs_improve"

    return _pick_by_precedence(top_labels, ROUTE_PRECEDENCE_ORDER) or "idea", "route_precedence"


def _resolve_continuity_candidate(
    continuity_scores: Dict[str, int],
    signals: Dict[str, bool],
) -> Tuple[str, Optional[str]]:
    """
    Resuelve candidato preliminar de continuity usando scores y desempates.
    """
    top_labels = _labels_with_max_score(continuity_scores)
    if not top_labels:
        return "stay", None

    if len(top_labels) == 1:
        return top_labels[0], None

    top_set = set(top_labels)

    if {"stay", "blueprint"}.issubset(top_set):
        if signals.get("has_clear_utility") and (
            signals.get("needs_definition_first")
            or signals.get("needs_output_definition")
            or signals.get("needs_scope_definition")
        ):
            return "blueprint", "stay_vs_blueprint"
        return "stay", "stay_vs_blueprint"

    if {"blueprint", "sistema"}.issubset(top_set):
        if signals.get("needs_multilayer_architecture") or signals.get("system_design_pressure_present"):
            return "sistema", "blueprint_vs_sistema"
        return "blueprint", "blueprint_vs_sistema"

    if {"sistema", "premium"}.issubset(top_set):
        if signals.get("executive_intensity_high"):
            return "premium", "sistema_vs_premium"
        return "sistema", "sistema_vs_premium"

    return _pick_by_precedence(top_labels, CONTINUITY_PRECEDENCE_ORDER) or "stay", "continuity_precedence"


def _apply_route_guardrails(
    route_candidate: str,
    route_scores: Dict[str, int],
    signals: Dict[str, bool],
) -> Tuple[str, List[str]]:
    """
    Aplica guardrails de route sobre el candidato preliminar.
    """
    final_route = route_candidate
    triggered: List[str] = []

    # Guardrail 1:
    # Si hay utilidad clara, no caer a idea por simple falta de detalle.
    if final_route == "idea" and signals.get("has_clear_utility"):
        non_idea_labels = [label for label in route_scores.keys() if label != "idea"]
        best_non_idea = max(non_idea_labels, key=lambda label: route_scores.get(label, 0))
        final_route = best_non_idea if route_scores.get(best_non_idea, 0) > 0 else "improve"
        if "clear_utility_should_not_fall_to_idea" in ROUTE_GUARDRAILS:
            triggered.append("clear_utility_should_not_fall_to_idea")

    # Guardrail 1.5:
    # Una idea comercial inmadura no debe derivar a sell.
    if signals.get("immature_commercial_idea") and final_route != "idea":
        final_route = "idea"
        if "immature_commercial_idea_should_not_drift_to_sell" in ROUTE_GUARDRAILS:
            triggered.append("immature_commercial_idea_should_not_drift_to_sell")

    # Guardrail 2:
    # Oferta existente + objetivo de vender mejor = sell.
    if signals.get("has_existing_offer") and signals.get("goal_sell_present"):
        if final_route != "sell":
            final_route = "sell"
            if "existing_offer_sell_should_not_drift_to_improve" in ROUTE_GUARDRAILS:
                triggered.append("existing_offer_sell_should_not_drift_to_improve")

    # Guardrail 3:
    # Dominio diagnóstico sin objetivo sell explícito favorece improve.
    if (
        signals.get("diagnostic_language_present")
        and not signals.get("goal_sell_present")
        and not signals.get("goal_automate_present")
        and final_route != "improve"
    ):
        final_route = "improve"
        if "diagnostic_cases_should_favor_improve" in ROUTE_GUARDRAILS:
            triggered.append("diagnostic_cases_should_favor_improve")

    # Guardrail 4:
    # Dominio operativo de automatización favorece automate.
    if (
        signals.get("goal_automate_present")
        and signals.get("automation_language_present")
        and not signals.get("ambiguity_high")
        and final_route != "automate"
    ):
        final_route = "automate"
        triggered.append("automation_cases_should_favor_automate")

    final_route = normalize_route(final_route)
    return final_route, triggered


def _apply_continuity_guardrails(
    continuity_candidate: str,
    continuity_scores: Dict[str, int],
    signals: Dict[str, bool],
) -> Tuple[str, List[str]]:
    """
    Aplica guardrails de continuity sobre el candidato preliminar.
    """
    final_path = continuity_candidate
    triggered: List[str] = []

    # Guardrail 1:
    # Si el caso sigue muy ambiguo y no hay utilidad clara, no ir a blueprint.
    if (
        signals.get("ambiguity_high")
        and signals.get("has_clear_utility_false")
        and final_path != "stay"
    ):
        final_path = "stay"
        if "unclear_cases_should_favor_stay" in CONTINUITY_GUARDRAILS:
            triggered.append("unclear_cases_should_favor_stay")

    # Guardrail 1.5:
    # Una idea comercial inmadura debe quedarse en stay.
    if signals.get("immature_commercial_idea") and final_path != "stay":
        final_path = "stay"
        if "immature_commercial_idea_should_favor_stay" in CONTINUITY_GUARDRAILS:
            triggered.append("immature_commercial_idea_should_favor_stay")

    # Guardrail 2:
    # Si la utilidad es clara pero falta definición básica, blueprint gana sobre stay.
    if (
        signals.get("has_clear_utility")
        and (
            signals.get("needs_definition_first")
            or signals.get("needs_output_definition")
            or signals.get("needs_scope_definition")
        )
        and final_path == "stay"
    ):
        final_path = "blueprint"

    # Guardrail 2.5:
    # Casos de oferta existente / reposicionamiento fuerte con intensidad alta
    # deben competir por premium por encima de blueprint.
    if (
        final_path == "blueprint"
        and signals.get("executive_intensity_high")
        and signals.get("has_clear_utility")
        and (
            signals.get("offer_language_present")
            or signals.get("has_existing_offer")
        )
    ):
        final_path = "premium"
        if "high_intensity_offer_cases_should_compete_for_premium" in CONTINUITY_GUARDRAILS:
            triggered.append("high_intensity_offer_cases_should_compete_for_premium")

    # Guardrail 3:
    # Casos multicapas deben competir por sistema.
    if (
        signals.get("needs_multilayer_architecture")
        and signals.get("system_design_pressure_present")
        and final_path in {"stay", "blueprint"}
    ):
        final_path = "premium" if signals.get("executive_intensity_high") else "sistema"
        if "multilayer_cases_should_compete_for_sistema" in CONTINUITY_GUARDRAILS:
            triggered.append("multilayer_cases_should_compete_for_sistema")

    # Guardrail 4:
    # Premium requiere evidencia fuerte.
    if (
        final_path == "premium"
        and not signals.get("executive_intensity_high")
        and not signals.get("needs_multilayer_architecture")
    ):
        final_path = "sistema" if continuity_scores.get("sistema", 0) >= continuity_scores.get("blueprint", 0) else "blueprint"
        if "premium_requires_high_intensity_evidence" in CONTINUITY_GUARDRAILS:
            triggered.append("premium_requires_high_intensity_evidence")

    if final_path not in ALLOWED_CONTINUITY_PATHS:
        final_path = "stay"

    return final_path, triggered


def _build_route_reason(route_final: str, signals: Dict[str, bool]) -> str:
    """
    Razón humana breve de route.
    """
    if route_final == "sell":
        return "El caso gira en vender mejor una oferta existente y cerrar más."
    if route_final == "automate":
        return "El núcleo del caso es automatizar una operativa o trabajo repetitivo."
    if route_final == "improve":
        return "El núcleo del caso es diagnosticar, detectar fricciones o mejorar estructura/rendimiento."
    return "El caso sigue demasiado abierto o ambiguo para salir de idea."


def _build_continuity_reason(continuity_final: str, signals: Dict[str, bool]) -> str:
    """
    Razón humana breve de continuity.
    """
    if continuity_final == "stay":
        return "Antes de intensificar, hace falta una definición más clara de utilidad, problema u output."
    if continuity_final == "blueprint":
        return "La utilidad ya se entiende, pero falta definir estructura, criterios, foco o formato de salida."
    if continuity_final == "sistema":
        return "El siguiente paso ya exige coordinar varias piezas, capas o flujos del sistema."
    return "El caso exige una capa de intensidad estructural o decisional más alta que un blueprint simple."


def build_decision_bundle(
    input_type: str,
    input_content: str,
    normalized_result: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Construye el bundle algorítmico de decisión para route + continuity.

    Este método NO muta normalized_result.
    """
    signal_bundle = build_decision_signals(
        input_type=input_type,
        input_content=input_content,
        normalized_result=normalized_result,
    )
    signals = signal_bundle["signals"]

    route_scores, route_score_details = _score_labels(ROUTE_SIGNAL_WEIGHTS, signals)
    continuity_scores, continuity_score_details = _score_labels(CONTINUITY_SIGNAL_WEIGHTS, signals)

    route_candidate, route_tie_break_used = _resolve_route_candidate(route_scores, signals)
    continuity_candidate, continuity_tie_break_used = _resolve_continuity_candidate(continuity_scores, signals)

    route_final, route_guardrails = _apply_route_guardrails(route_candidate, route_scores, signals)
    continuity_final, continuity_guardrails = _apply_continuity_guardrails(
        continuity_candidate,
        continuity_scores,
        signals,
    )

    route_reason = _build_route_reason(route_final, signals)
    continuity_reason = _build_continuity_reason(continuity_final, signals)

    return {
        "route_final": route_final,
        "continuity_final": continuity_final,
        "route_scores": route_scores,
        "continuity_scores": continuity_scores,
        "route_score_details": route_score_details,
        "continuity_score_details": continuity_score_details,
        "active_signals": signal_bundle["active_signals"],
        "matched_phrases": signal_bundle["matched_phrases"],
        "text_bundle": signal_bundle["text_bundle"],
        "route_tie_break_used": route_tie_break_used,
        "continuity_tie_break_used": continuity_tie_break_used,
        "route_tie_break_reason": ROUTE_TIEBREAKERS.get(route_tie_break_used, ""),
        "continuity_tie_break_reason": CONTINUITY_TIEBREAKERS.get(continuity_tie_break_used, ""),
        "guardrails_triggered": {
            "route": route_guardrails,
            "continuity": continuity_guardrails,
        },
        "route_reason": route_reason,
        "continuity_reason": continuity_reason,
        "continuity_cta_label": CONTINUITY_DEFAULT_CTA_BY_PATH.get(continuity_final, "Seguir analizando"),
        "decision_reason": f"{route_reason} {continuity_reason}".strip(),
    }


def apply_decision_to_normalized_result(
    normalized_result: Dict[str, Any],
    decision_bundle: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Aplica route + continuity decididos al resultado normalizado,
    sin modificar el contrato público existente.
    """
    result = deepcopy(normalized_result)

    result["route"] = normalize_route(decision_bundle.get("route_final"))

    diagnosis = result.get("diagnosis", {})
    if not isinstance(diagnosis, dict):
        diagnosis = {}

    continuity_recommendation = diagnosis.get("continuity_recommendation", {})
    if not isinstance(continuity_recommendation, dict):
        continuity_recommendation = {}

    continuity_final = ensure_string(decision_bundle.get("continuity_final"), "stay").lower()
    if continuity_final not in ALLOWED_CONTINUITY_PATHS:
        continuity_final = "stay"

    continuity_recommendation["recommended_path"] = continuity_final
    continuity_recommendation["reason"] = ensure_string(
        decision_bundle.get("continuity_reason"),
        ensure_string(
            continuity_recommendation.get("reason"),
            "La recomendación de continuidad aún debe precisarse mejor.",
        ),
    )
    continuity_recommendation["cta_label"] = ensure_string(
        decision_bundle.get("continuity_cta_label"),
        CONTINUITY_DEFAULT_CTA_BY_PATH.get(continuity_final, "Seguir analizando"),
    )

    diagnosis["continuity_recommendation"] = continuity_recommendation
    result["diagnosis"] = diagnosis

    return result


def decide_and_apply_analysis_result(
    input_type: str,
    input_content: str,
    normalized_result: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Helper de conveniencia para:
    1. construir decision bundle
    2. aplicar decision al resultado normalizado
    """
    decision_bundle = build_decision_bundle(
        input_type=input_type,
        input_content=input_content,
        normalized_result=normalized_result,
    )
    applied_result = apply_decision_to_normalized_result(
        normalized_result=normalized_result,
        decision_bundle=decision_bundle,
    )

    return {
        "decision_bundle": decision_bundle,
        "applied_result": applied_result,
    }