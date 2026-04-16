from typing import Any, Dict, List, Optional

from app.domain.plans import PLANS


def clamp_score(value: int) -> int:
    return max(0, min(4, value))


def keyword_hits(text: str, keywords: List[str]) -> int:
    lowered = (text or "").lower()
    return sum(1 for kw in keywords if kw in lowered)


def build_plan_recommendation(
    input_type: str,
    input_content: str,
    analysis: Dict[str, Any],
    url_analysis: Optional[Dict[str, Any]] = None,
    refine_answers: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    route = analysis.get("route", "idea")
    diagnosis = analysis.get("diagnosis") or {}
    refine_questions = analysis.get("refine_questions") or []
    refine_answers = refine_answers or {}

    url_content = {}
    if isinstance(url_analysis, dict):
        url_content = url_analysis.get("content", url_analysis)

    summary = diagnosis.get("summary", "")
    strengths = diagnosis.get("strengths") or []
    weaknesses = diagnosis.get("weaknesses") or []
    quick_wins = diagnosis.get("quick_wins") or []

    answers_text = " ".join(
        str(v) for v in refine_answers.values() if isinstance(v, (str, int, float))
    )

    combined_text = " ".join([
        str(input_content or ""),
        str(summary or ""),
        " ".join(str(x) for x in strengths),
        " ".join(str(x) for x in weaknesses),
        " ".join(str(x) for x in quick_wins),
        answers_text
    ])

    conversion_keywords = [
        "convers", "cta", "capt", "lead", "ventas", "checkout", "precio",
        "pricing", "embudo", "funnel", "formular", "contact", "reserva"
    ]
    money_keywords = [
        "monet", "ingres", "ticket", "suscrip", "upsell", "retención",
        "margen", "beneficio", "facturación", "ventas"
    ]
    urgency_keywords = [
        "urg", "bloque", "caída", "perdiendo", "fricción", "abandono",
        "lento", "carga", "ya", "inmediato"
    ]
    continuity_keywords = [
        "escala", "automat", "continu", "roadmap", "sistema",
        "evolu", "iter", "crecim", "equipo"
    ]

    cta_count = len(url_content.get("ctas", []) or [])
    h2_count = len(url_content.get("h2", []) or [])
    forms_count = int(url_content.get("forms_count", 0) or 0)

    complexity = {
        "idea": 1,
        "improve": 2,
        "sell": 2,
        "automate": 3
    }.get(route, 1)

    if len(weaknesses) >= 3:
        complexity += 1
    if input_type == "url" and (forms_count > 0 or cta_count >= 3 or h2_count >= 5):
        complexity += 1
    if len(refine_answers) >= 2:
        complexity += 1
    complexity = clamp_score(complexity)

    economic_impact = {
        "idea": 1,
        "improve": 2,
        "sell": 3,
        "automate": 2
    }.get(route, 1)

    if keyword_hits(combined_text, conversion_keywords) >= 2:
        economic_impact += 1
    if keyword_hits(combined_text, money_keywords) >= 2:
        economic_impact += 1
    if input_type == "url" and (forms_count > 0 or cta_count >= 2):
        economic_impact += 1
    economic_impact = clamp_score(economic_impact)

    urgency = {
        "idea": 0,
        "improve": 1,
        "sell": 1,
        "automate": 1
    }.get(route, 0)

    if keyword_hits(combined_text, urgency_keywords) >= 1:
        urgency += 1
    if len(weaknesses) >= 4:
        urgency += 1
    if input_type == "url" and cta_count == 0 and forms_count == 0:
        urgency += 1
    urgency = clamp_score(urgency)

    structure_need = {
        "idea": 1,
        "improve": 2,
        "sell": 2,
        "automate": 3
    }.get(route, 1)

    if len(quick_wins) >= 2 and len(weaknesses) >= 2:
        structure_need += 1
    if len(refine_questions) >= 2 or len(refine_answers) >= 2:
        structure_need += 1
    structure_need = clamp_score(structure_need)

    continuity_need = {
        "idea": 1,
        "improve": 1,
        "sell": 2,
        "automate": 2
    }.get(route, 1)

    if input_type == "url":
        continuity_need += 1
    if keyword_hits(combined_text, continuity_keywords) >= 1:
        continuity_need += 1
    if len(refine_answers) >= 2:
        continuity_need += 1
    continuity_need = clamp_score(continuity_need)

    score_total = complexity + economic_impact + urgency + structure_need + continuity_need

    if score_total <= 7:
        recommended_plan = "blueprint"
    elif score_total <= 13:
        recommended_plan = "sistema"
    else:
        if complexity >= 3 and (structure_need >= 3 or continuity_need >= 3):
            recommended_plan = "premium"
        else:
            recommended_plan = "sistema"

    if recommended_plan == "blueprint":
        reason = (
            "Tu caso todavía encaja en una fase de diagnóstico afinado. "
            "El siguiente cuello de botella no es la complejidad del sistema, "
            "sino precisar mejor el problema real y priorizar quick wins."
        )
        why_not_lower = (
            "La capa gratuita ayuda a detectar señales iniciales, "
            "pero aquí ya conviene afinar el diagnóstico y ordenar mejor el foco."
        )
        unlocks = "Más precisión, prioridad inicial y una primera dirección accionable."
        cta_label = "Afinar diagnóstico"
    elif recommended_plan == "sistema":
        reason = (
            "Tu caso ya supera una mejora puntual. "
            "Aquí el verdadero cuello de botella ya no es detectar el problema, "
            "sino ordenar qué tocar primero, con qué prioridad y con qué lógica de ejecución."
        )
        why_not_lower = (
            "Un diagnóstico afinado se quedaría corto porque aquí ya no basta con detectar fallos; "
            "hace falta priorizar y estructurar."
        )
        unlocks = "Prioridades, arquitectura y plan accionable para ejecutar con criterio."
        cta_label = "Convertir esto en un plan accionable"
    else:
        reason = (
            "Aquí ya no hablamos solo de corregir un bloque aislado. "
            "El caso presenta varios frentes con impacto comercial, de conversión o de sistema, "
            "y necesita una capa superior de profundidad estratégica."
        )
        why_not_lower = (
            "Un blueprint básico ayudaría, pero aquí hay suficiente complejidad e impacto "
            "como para necesitar una intervención más profunda."
        )
        unlocks = "Profundidad estratégica, continuidad y una intervención más completa."
        cta_label = "Activar intervención estratégica completa"

    plan_data = PLANS[recommended_plan]

    return {
        "recommended_plan_id": recommended_plan,
        "recommended_plan_name": plan_data["name"],
        "recommended_plan_price": plan_data["price"],
        "score_total": score_total,
        "scores": {
            "complexity": complexity,
            "economic_impact": economic_impact,
            "urgency": urgency,
            "structure_need": structure_need,
            "continuity_need": continuity_need
        },
        "reason": reason,
        "why_not_lower": why_not_lower,
        "unlocks": unlocks,
        "cta_label": cta_label,
        "version": "v1"
    }
