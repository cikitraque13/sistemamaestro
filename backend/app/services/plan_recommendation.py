from typing import Any, Dict, List, Optional

from backend.app.domain.plans import PLANS


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

    # Regla de decisión más conservadora:
    # - Blueprint/Pro = continuidad normal por defecto
    # - Sistema/Growth = casos ya operativos
    # - Premium/199 = solo casos de intensidad realmente alta
    premium_gate = (
        score_total >= 17
        and complexity >= 4
        and economic_impact >= 4
        and structure_need >= 4
        and continuity_need >= 3
    )

    sistema_gate = (
        score_total >= 12
        or (
            complexity >= 3
            and economic_impact >= 3
        )
        or (
            structure_need >= 3
            and continuity_need >= 3
        )
    )

    if premium_gate:
        recommended_plan = "premium"
    elif sistema_gate:
        recommended_plan = "sistema"
    else:
        recommended_plan = "blueprint"

    if recommended_plan == "blueprint":
        reason = (
            "Tu caso necesita una capa seria de orden, criterio y dirección, "
            "pero todavía no exige una intervención de máxima intensidad. "
            "Lo correcto ahora es aterrizar el caso con un blueprint bien enfocado."
        )
        why_not_lower = (
            "La capa gratuita detecta señales iniciales, pero aquí ya conviene "
            "pasar a una base real de trabajo con más precisión y estructura."
        )
        unlocks = "Ruta clara, prioridad inicial, estructura útil y una primera base accionable."
        cta_label = "Entrar en Pro"
    elif recommended_plan == "sistema":
        reason = (
            "Tu caso ya supera una mejora puntual. "
            "Aquí no basta con ordenar el problema: hace falta continuidad operativa, "
            "priorización más firme y una capa de ejecución con más recorrido."
        )
        why_not_lower = (
            "El nivel Pro ayuda a estructurar, pero aquí ya hay suficiente carga "
            "como para necesitar una continuidad más operativa."
        )
        unlocks = "Continuidad, optimización, builder con más recorrido y ejecución mejor encadenada."
        cta_label = "Entrar en Growth"
    else:
        reason = (
            "El caso combina complejidad alta, impacto alto y necesidad estructural profunda. "
            "Aquí ya no se trata solo de ordenar o continuar, sino de intervenir con un criterio superior."
        )
        why_not_lower = (
            "Growth ayudaría, pero se quedaría corto frente al nivel de complejidad, "
            "impacto y profundidad estratégica que presenta este caso."
        )
        unlocks = "Profundidad estratégica, criterio maestro, builder avanzado y salida más preparada."
        cta_label = "Entrar en AI Master"
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
        "version": "v2"
    }
