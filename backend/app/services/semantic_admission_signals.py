"""
semantic_admission_signals.py

Extraccion de senales para la Capa de Admision Semantica v1.

Responsabilidades:
- leer texto ya normalizado
- detectar senales semanticas canonicas
- devolver bundle trazable con:
  - signals
  - active_signals
  - matched_phrases
  - text_bundle

No contiene:
- scoring
- precedencias
- guardrails de decision
- integracion con ai_analysis.py
"""

from __future__ import annotations

import re
import unicodedata
from typing import Any, Dict, Iterable, List, Sequence, Tuple

from backend.app.services.ai_analysis_common import ensure_string
from backend.app.services.semantic_admission_rules import (
    ARCHITECTURE_SIGNAL_PHRASES,
    AUDIT_SIGNAL_PHRASES,
    AUTOMATION_SIGNAL_PHRASES,
    BENEFIT_DENSITY_SIGNAL_PHRASES,
    BUILD_SIGNAL_PHRASES,
    CONVERSION_GOAL_SIGNAL_PHRASES,
    DIAGNOSTIC_SIGNAL_PHRASES,
    EXISTING_OFFER_SIGNAL_PHRASES,
    EXPLICIT_AUTOMATE_INTENT_PHRASES,
    EXPLICIT_BUILD_INTENT_PHRASES,
    EXPLICIT_DIAGNOSE_INTENT_PHRASES,
    EXPLICIT_SELL_INTENT_PHRASES,
    EXPLICIT_VALIDATE_INTENT_PHRASES,
    FEATURE_DENSITY_SIGNAL_PHRASES,
    FLOW_SIGNAL_PHRASES,
    FORMAT_MISSING_SIGNAL_PHRASES,
    FRICTION_SIGNAL_PHRASES,
    IDEA_SIGNAL_PHRASES,
    IMPROVEMENT_SIGNAL_PHRASES,
    INTEGRATION_SIGNAL_PHRASES,
    MIXED_INTENT_SIGNAL_PHRASES,
    OFFER_LANGUAGE_SIGNAL_PHRASES,
    OPS_SIGNAL_PHRASES,
    OUTPUT_DEFINED_SIGNAL_PHRASES,
    POSITIONING_SIGNAL_PHRASES,
    PRESENTATION_SIGNAL_PHRASES,
    PREMIUM_SIGNAL_PHRASES,
    SYSTEM_SIGNAL_PHRASES,
    UNCERTAINTY_SIGNAL_PHRASES,
    VALIDATION_SIGNAL_PHRASES,
)

# ---------------------------------------------------------------------------
# Heuristicas auxiliares
# ---------------------------------------------------------------------------

_FEATURE_NUMBER_PATTERNS: Tuple[str, ...] = (
    r"\b\d+\s*(horas?|h)\b",
    r"\b\d+\s*(min|minutos?)\b",
    r"\b\d+\s*(segundos?)\b",
    r"\b\d+\s*x\s*\d+\b",
    r"\b\d+\s*-\s*a\s*-\s*\d+\b",
    r"\+\$\d+[mk]?\b",
)

_BENEFIT_LANGUAGE_PATTERNS: Tuple[str, ...] = (
    r"\bahorrar\b",
    r"\brecuperar\b",
    r"\beliminando\b",
    r"\bsin friccion\b",
    r"\bcrecimiento acelerado\b",
    r"\bmaximizar la conversion\b",
)

_OUTPUT_LANGUAGE_PATTERNS: Tuple[str, ...] = (
    r"\bhoja de ruta\b",
    r"\bmapa de riesgos\b",
    r"\bprioridades\b",
    r"\brecomendaciones\b",
    r"\bdiagnostico\b",
    r"\bagendar citas\b",
)

_EXPLICIT_SELL_PATTERNS: Tuple[str, ...] = (
    r"\bquiero vender\b",
    r"\bvenderl[oa]s?\b",
    r"\bquiero venderl[oa]s?\b",
    r"\bquiero vender mejor\b",
    r"\bquiero posicionarl[oa]s?\b",
)

_EXPLICIT_BUILD_PATTERNS: Tuple[str, ...] = (
    r"\bquiero construir\b",
    r"\bconstruirl[oa]s?\b",
    r"\bquiero construirl[oa]s?\b",
    r"\bquiero desarrollar\b",
    r"\bquiero montar\b",
)

_EXPLICIT_VALIDATE_PATTERNS: Tuple[str, ...] = (
    r"\bquiero validar\b",
    r"\bvalidarl[oa]s?\b",
    r"\bquiero validarl[oa]s?\b",
    r"\bvalidar primero\b",
    r"\bsi tiene mercado\b",
)

_EXPLICIT_AUTOMATE_PATTERNS: Tuple[str, ...] = (
    r"\bquiero automatizar\b",
    r"\bautomatizarl[oa]s?\b",
)

_EXPLICIT_DIAGNOSE_PATTERNS: Tuple[str, ...] = (
    r"\bquiero auditar\b",
    r"\bquiero diagnosticar\b",
    r"\bquiero analizar\b",
    r"\bauditar\b",
    r"\bdiagnosticar\b",
)

_MIXED_INTENT_PATTERNS: Tuple[str, ...] = (
    r"\bno se si\b",
    r"\bvalidar\w*\s+o\s+construir\w*\b",
    r"\bconstruir\w*\s+o\s+validar\w*\b",
    r"\bvender\w*\s+o\s+construir\w*\b",
    r"\bconstruir\w*\s+o\s+vender\w*\b",
    r"\bvender\w*\s+o\s+validar\w*\b",
    r"\bvalidar\w*\s+o\s+vender\w*\b",
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _normalize_signal_text(value: Any) -> str:
    """
    Normaliza texto para matching robusto:
    - lowercase
    - sin acentos
    - espacios compactados
    """
    text = ensure_string(value, "").strip().lower()
    if not text:
        return ""

    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _contains_any_phrase(text: str, phrases: Sequence[str]) -> Tuple[bool, List[str]]:
    """
    Devuelve:
    - si el texto contiene alguna frase
    - lista deduplicada de hits
    """
    if not text:
        return False, []

    hits: List[str] = []
    seen = set()

    for phrase in phrases:
        candidate = _normalize_signal_text(phrase)
        if not candidate:
            continue
        if candidate in text and candidate not in seen:
            hits.append(candidate)
            seen.add(candidate)

    return bool(hits), hits


def _contains_any_pattern(text: str, patterns: Sequence[str]) -> Tuple[bool, List[str]]:
    """
    Detecta regex patterns y devuelve los patrones que hicieron match.
    """
    if not text:
        return False, []

    hits: List[str] = []
    for pattern in patterns:
        if re.search(pattern, text, flags=re.IGNORECASE):
            hits.append(pattern)

    deduped: List[str] = []
    seen = set()
    for item in hits:
        if item not in seen:
            deduped.append(item)
            seen.add(item)

    return bool(deduped), deduped


def _merge_hits(
    matched_phrases: Dict[str, List[str]],
    signal_name: str,
    source: str,
    hits: Iterable[str],
) -> None:
    """
    Registra hits con prefijo de origen.
    """
    bucket = matched_phrases.setdefault(signal_name, [])
    for hit in hits:
        candidate = ensure_string(hit, "").strip()
        if not candidate:
            continue
        tagged = f"{source}:{candidate}"
        if tagged not in bucket:
            bucket.append(tagged)


def _phrase_signal(
    signal_name: str,
    text: str,
    phrases: Sequence[str],
    matched_phrases: Dict[str, List[str]],
) -> bool:
    """
    Evalua senal por frases.
    """
    flag, hits = _contains_any_phrase(text, phrases)
    _merge_hits(matched_phrases, signal_name, "phrase", hits)
    return flag


def _pattern_signal(
    signal_name: str,
    text: str,
    patterns: Sequence[str],
    matched_phrases: Dict[str, List[str]],
) -> bool:
    """
    Evalua senal por regex patterns.
    """
    flag, hits = _contains_any_pattern(text, patterns)
    _merge_hits(matched_phrases, signal_name, "pattern", hits)
    return flag


def _active_signal_names(signals: Dict[str, bool]) -> List[str]:
    """
    Devuelve las senales activas ordenadas.
    """
    return sorted([name for name, value in signals.items() if value])


def _count_semantic_hits(text: str, phrases: Sequence[str]) -> int:
    """
    Cuenta hits simples de una familia de frases.
    """
    _, hits = _contains_any_phrase(text, phrases)
    return len(hits)


def build_semantic_admission_signals(
    input_mode: str,
    normalized_text: str,
    normalization_meta: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """
    Extrae senales de admision semantica desde texto ya normalizado.

    Devuelve:
    {
      "signals": {...},
      "active_signals": [...],
      "matched_phrases": {...},
      "text_bundle": {...}
    }
    """
    resolved_input_mode = ensure_string(input_mode, "text").strip().lower()
    text = _normalize_signal_text(normalized_text)
    normalization_meta = normalization_meta if isinstance(normalization_meta, dict) else {}

    matched_phrases: Dict[str, List[str]] = {}

    # ------------------------------------------------------------------
    # Senales base por frases
    # ------------------------------------------------------------------

    existing_offer_signal = _phrase_signal(
        "existing_offer_signal",
        text,
        EXISTING_OFFER_SIGNAL_PHRASES,
        matched_phrases,
    )

    offer_language_signal = _phrase_signal(
        "offer_language_signal",
        text,
        OFFER_LANGUAGE_SIGNAL_PHRASES,
        matched_phrases,
    )

    presentation_signal = _phrase_signal(
        "presentation_signal",
        text,
        PRESENTATION_SIGNAL_PHRASES,
        matched_phrases,
    )

    positioning_signal = _phrase_signal(
        "positioning_signal",
        text,
        POSITIONING_SIGNAL_PHRASES,
        matched_phrases,
    )

    premium_signal = _phrase_signal(
        "premium_signal",
        text,
        PREMIUM_SIGNAL_PHRASES,
        matched_phrases,
    )

    conversion_goal_signal = _phrase_signal(
        "conversion_goal_signal",
        text,
        CONVERSION_GOAL_SIGNAL_PHRASES,
        matched_phrases,
    )

    build_signal = _phrase_signal(
        "build_signal",
        text,
        BUILD_SIGNAL_PHRASES,
        matched_phrases,
    )

    system_signal = _phrase_signal(
        "system_signal",
        text,
        SYSTEM_SIGNAL_PHRASES,
        matched_phrases,
    )

    architecture_signal = _phrase_signal(
        "architecture_signal",
        text,
        ARCHITECTURE_SIGNAL_PHRASES,
        matched_phrases,
    )

    integration_signal = _phrase_signal(
        "integration_signal",
        text,
        INTEGRATION_SIGNAL_PHRASES,
        matched_phrases,
    )

    automation_signal = _phrase_signal(
        "automation_signal",
        text,
        AUTOMATION_SIGNAL_PHRASES,
        matched_phrases,
    )

    flow_signal = _phrase_signal(
        "flow_signal",
        text,
        FLOW_SIGNAL_PHRASES,
        matched_phrases,
    )

    ops_signal = _phrase_signal(
        "ops_signal",
        text,
        OPS_SIGNAL_PHRASES,
        matched_phrases,
    )

    diagnostic_signal = _phrase_signal(
        "diagnostic_signal",
        text,
        DIAGNOSTIC_SIGNAL_PHRASES,
        matched_phrases,
    )

    audit_signal = _phrase_signal(
        "audit_signal",
        text,
        AUDIT_SIGNAL_PHRASES,
        matched_phrases,
    )

    friction_signal = _phrase_signal(
        "friction_signal",
        text,
        FRICTION_SIGNAL_PHRASES,
        matched_phrases,
    )

    improvement_signal = _phrase_signal(
        "improvement_signal",
        text,
        IMPROVEMENT_SIGNAL_PHRASES,
        matched_phrases,
    )

    idea_signal = _phrase_signal(
        "idea_signal",
        text,
        IDEA_SIGNAL_PHRASES,
        matched_phrases,
    )

    uncertainty_signal = _phrase_signal(
        "uncertainty_signal",
        text,
        UNCERTAINTY_SIGNAL_PHRASES,
        matched_phrases,
    )

    validation_signal = _phrase_signal(
        "validation_signal",
        text,
        VALIDATION_SIGNAL_PHRASES,
        matched_phrases,
    )

    format_missing_signal = _phrase_signal(
        "format_missing_signal",
        text,
        FORMAT_MISSING_SIGNAL_PHRASES,
        matched_phrases,
    )

    # ------------------------------------------------------------------
    # Intencion explicita
    # ------------------------------------------------------------------

    explicit_sell_intent_signal = _phrase_signal(
        "explicit_sell_intent_signal",
        text,
        EXPLICIT_SELL_INTENT_PHRASES,
        matched_phrases,
    ) or _pattern_signal(
        "explicit_sell_intent_signal",
        text,
        _EXPLICIT_SELL_PATTERNS,
        matched_phrases,
    )

    explicit_build_intent_signal = _phrase_signal(
        "explicit_build_intent_signal",
        text,
        EXPLICIT_BUILD_INTENT_PHRASES,
        matched_phrases,
    ) or _pattern_signal(
        "explicit_build_intent_signal",
        text,
        _EXPLICIT_BUILD_PATTERNS,
        matched_phrases,
    )

    explicit_validate_intent_signal = _phrase_signal(
        "explicit_validate_intent_signal",
        text,
        EXPLICIT_VALIDATE_INTENT_PHRASES,
        matched_phrases,
    ) or _pattern_signal(
        "explicit_validate_intent_signal",
        text,
        _EXPLICIT_VALIDATE_PATTERNS,
        matched_phrases,
    )

    explicit_automate_intent_signal = _phrase_signal(
        "explicit_automate_intent_signal",
        text,
        EXPLICIT_AUTOMATE_INTENT_PHRASES,
        matched_phrases,
    ) or _pattern_signal(
        "explicit_automate_intent_signal",
        text,
        _EXPLICIT_AUTOMATE_PATTERNS,
        matched_phrases,
    )

    explicit_diagnose_intent_signal = _phrase_signal(
        "explicit_diagnose_intent_signal",
        text,
        EXPLICIT_DIAGNOSE_INTENT_PHRASES,
        matched_phrases,
    ) or _pattern_signal(
        "explicit_diagnose_intent_signal",
        text,
        _EXPLICIT_DIAGNOSE_PATTERNS,
        matched_phrases,
    )

    mixed_intent_phrase_signal = _phrase_signal(
        "mixed_intent_signal",
        text,
        MIXED_INTENT_SIGNAL_PHRASES,
        matched_phrases,
    ) or _pattern_signal(
        "mixed_intent_signal",
        text,
        _MIXED_INTENT_PATTERNS,
        matched_phrases,
    )

    explicit_intent_count = sum(
        1
        for flag in (
            explicit_sell_intent_signal,
            explicit_build_intent_signal,
            explicit_validate_intent_signal,
            explicit_automate_intent_signal,
            explicit_diagnose_intent_signal,
        )
        if flag
    )

    mixed_intent_signal = mixed_intent_phrase_signal or explicit_intent_count >= 2
    if mixed_intent_signal and explicit_intent_count >= 2:
        _merge_hits(
            matched_phrases,
            "mixed_intent_signal",
            "derived",
            [f"explicit_intent_count={explicit_intent_count}"],
        )

    # ------------------------------------------------------------------
    # Senales de densidad descriptiva / heuristicas hibridas
    # ------------------------------------------------------------------

    feature_density_phrase_hits = _count_semantic_hits(text, FEATURE_DENSITY_SIGNAL_PHRASES)
    feature_density_pattern_flag = _pattern_signal(
        "feature_density_signal",
        text,
        _FEATURE_NUMBER_PATTERNS,
        matched_phrases,
    )
    if feature_density_phrase_hits:
        _, feature_density_phrase_list = _contains_any_phrase(text, FEATURE_DENSITY_SIGNAL_PHRASES)
        _merge_hits(matched_phrases, "feature_density_signal", "phrase", feature_density_phrase_list)

    feature_density_signal = feature_density_pattern_flag or feature_density_phrase_hits >= 2

    benefit_density_phrase_hits = _count_semantic_hits(text, BENEFIT_DENSITY_SIGNAL_PHRASES)
    benefit_density_pattern_flag = _pattern_signal(
        "benefit_density_signal",
        text,
        _BENEFIT_LANGUAGE_PATTERNS,
        matched_phrases,
    )
    if benefit_density_phrase_hits:
        _, benefit_density_phrase_list = _contains_any_phrase(text, BENEFIT_DENSITY_SIGNAL_PHRASES)
        _merge_hits(matched_phrases, "benefit_density_signal", "phrase", benefit_density_phrase_list)

    benefit_density_signal = benefit_density_pattern_flag or benefit_density_phrase_hits >= 1

    output_defined_phrase_hits = _count_semantic_hits(text, OUTPUT_DEFINED_SIGNAL_PHRASES)
    output_defined_pattern_flag = _pattern_signal(
        "output_defined_signal",
        text,
        _OUTPUT_LANGUAGE_PATTERNS,
        matched_phrases,
    )
    if output_defined_phrase_hits:
        _, output_defined_phrase_list = _contains_any_phrase(text, OUTPUT_DEFINED_SIGNAL_PHRASES)
        _merge_hits(matched_phrases, "output_defined_signal", "phrase", output_defined_phrase_list)

    output_defined_signal = output_defined_pattern_flag or output_defined_phrase_hits >= 1

    # ------------------------------------------------------------------
    # Senales derivadas de mezcla / naturaleza fuerte sin intencion
    # ------------------------------------------------------------------

    strong_nature_without_explicit_intent_signal = (
        any(
            [
                system_signal,
                architecture_signal,
                integration_signal,
                automation_signal,
                flow_signal,
                ops_signal,
            ]
        )
        and not any(
            [
                explicit_sell_intent_signal,
                explicit_build_intent_signal,
                explicit_validate_intent_signal,
                explicit_automate_intent_signal,
                explicit_diagnose_intent_signal,
            ]
        )
    )

    if strong_nature_without_explicit_intent_signal:
        _merge_hits(
            matched_phrases,
            "strong_nature_without_explicit_intent_signal",
            "derived",
            ["strong_nature_without_explicit_intent"],
        )

    # ------------------------------------------------------------------
    # Senales especificas de voz
    # ------------------------------------------------------------------

    filler_hit_count_before = int(normalization_meta.get("filler_hit_count_before", 0))
    removed_filler_count = int(normalization_meta.get("removed_filler_count", 0))
    self_correction_hit_count = int(normalization_meta.get("self_correction_hit_count", 0))
    fragment_hint_count = int(normalization_meta.get("fragment_hint_count", 0))
    disfluency_ratio = float(normalization_meta.get("disfluency_ratio", 0.0))
    sentence_count = int(normalization_meta.get("sentence_count", 0))

    spoken_disfluency_signal = (
        resolved_input_mode == "voice_transcript"
        and (filler_hit_count_before > 0 or removed_filler_count > 0 or disfluency_ratio >= 0.08)
    )

    self_correction_signal = (
        resolved_input_mode == "voice_transcript"
        and self_correction_hit_count > 0
    )

    fragmented_sentence_signal = (
        resolved_input_mode == "voice_transcript"
        and (fragment_hint_count > 0 or (sentence_count > 0 and sentence_count <= 2 and disfluency_ratio >= 0.08))
    )

    if spoken_disfluency_signal:
        _merge_hits(
            matched_phrases,
            "spoken_disfluency_signal",
            "meta",
            [
                f"filler_hit_count_before={filler_hit_count_before}",
                f"removed_filler_count={removed_filler_count}",
                f"disfluency_ratio={disfluency_ratio}",
            ],
        )

    if self_correction_signal:
        _merge_hits(
            matched_phrases,
            "self_correction_signal",
            "meta",
            [f"self_correction_hit_count={self_correction_hit_count}"],
        )

    if fragmented_sentence_signal:
        _merge_hits(
            matched_phrases,
            "fragmented_sentence_signal",
            "meta",
            [
                f"fragment_hint_count={fragment_hint_count}",
                f"sentence_count={sentence_count}",
                f"disfluency_ratio={disfluency_ratio}",
            ],
        )

    # ------------------------------------------------------------------
    # Bundle final
    # ------------------------------------------------------------------

    signals: Dict[str, bool] = {
        "existing_offer_signal": existing_offer_signal,
        "offer_language_signal": offer_language_signal,
        "presentation_signal": presentation_signal,
        "positioning_signal": positioning_signal,
        "premium_signal": premium_signal,
        "conversion_goal_signal": conversion_goal_signal,
        "explicit_sell_intent_signal": explicit_sell_intent_signal,
        "explicit_build_intent_signal": explicit_build_intent_signal,
        "explicit_validate_intent_signal": explicit_validate_intent_signal,
        "explicit_automate_intent_signal": explicit_automate_intent_signal,
        "explicit_diagnose_intent_signal": explicit_diagnose_intent_signal,
        "mixed_intent_signal": mixed_intent_signal,
        "build_signal": build_signal,
        "system_signal": system_signal,
        "architecture_signal": architecture_signal,
        "integration_signal": integration_signal,
        "automation_signal": automation_signal,
        "flow_signal": flow_signal,
        "ops_signal": ops_signal,
        "diagnostic_signal": diagnostic_signal,
        "audit_signal": audit_signal,
        "friction_signal": friction_signal,
        "improvement_signal": improvement_signal,
        "idea_signal": idea_signal,
        "uncertainty_signal": uncertainty_signal,
        "validation_signal": validation_signal,
        "format_missing_signal": format_missing_signal,
        "feature_density_signal": feature_density_signal,
        "benefit_density_signal": benefit_density_signal,
        "output_defined_signal": output_defined_signal,
        "strong_nature_without_explicit_intent_signal": strong_nature_without_explicit_intent_signal,
        "spoken_disfluency_signal": spoken_disfluency_signal,
        "fragmented_sentence_signal": fragmented_sentence_signal,
        "self_correction_signal": self_correction_signal,
    }

    return {
        "signals": signals,
        "active_signals": _active_signal_names(signals),
        "matched_phrases": matched_phrases,
        "text_bundle": {
            "input_mode": resolved_input_mode,
            "normalized_text": text,
            "raw_length": normalization_meta.get("raw_length"),
            "normalized_length": normalization_meta.get("normalized_length"),
            "sentence_count": normalization_meta.get("sentence_count"),
            "disfluency_ratio": normalization_meta.get("disfluency_ratio"),
        },
    }