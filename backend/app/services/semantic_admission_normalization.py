"""
semantic_admission_normalization.py

Normalización multimodal para la Capa de Admisión Semántica v1.

Responsabilidades:
- normalizar texto escrito
- normalizar texto pegado
- normalizar transcripción de micrófono
- limpiar ruido conversacional sin borrar señales semánticas útiles
- devolver metadatos de normalización trazables y serializables

No contiene:
- extracción de señales
- scoring
- precedencias
- guardrails de decisión
- integración con ai_analysis.py
"""

from __future__ import annotations

import re
import unicodedata
from typing import Any, Dict, List, Sequence, Tuple

from backend.app.services.ai_analysis_common import ensure_string
from backend.app.services.semantic_admission_rules import (
    ALLOWED_INPUT_MODES,
    VOICE_FILLER_PHRASES,
    VOICE_FRAGMENT_HINTS,
    VOICE_SELF_CORRECTION_PHRASES,
)

_DEFAULT_INPUT_MODE = "text"


def _resolve_input_mode(value: Any) -> str:
    """
    Resuelve un input_mode válido de forma defensiva.
    """
    mode = ensure_string(value, _DEFAULT_INPUT_MODE).strip().lower()

    aliases = {
        "voice": "voice_transcript",
        "audio": "voice_transcript",
        "speech": "voice_transcript",
        "dictation": "voice_transcript",
        "typed": "text",
        "paste": "pasted_text",
        "pasted": "pasted_text",
    }

    mode = aliases.get(mode, mode)

    if mode not in ALLOWED_INPUT_MODES:
        return _DEFAULT_INPUT_MODE
    return mode


def _normalize_unicode(text: str) -> str:
    """
    Normaliza unicode y reemplaza algunos caracteres tipográficos comunes.
    """
    if not text:
        return ""

    text = unicodedata.normalize("NFKC", text)
    text = (
        text.replace("\u2018", "'")
        .replace("\u2019", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2013", "-")
        .replace("\u2014", "-")
        .replace("\u2026", "...")
        .replace("\u00a0", " ")
    )
    return text


def _normalize_line_breaks(text: str) -> str:
    """
    Unifica saltos de línea.
    """
    if not text:
        return ""
    return text.replace("\r\n", "\n").replace("\r", "\n")


def _normalize_spacing(text: str) -> str:
    """
    Compacta espacios y limpia saltos redundantes.
    """
    if not text:
        return ""

    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" *\n *", "\n", text)
    return text.strip()


def _normalize_punctuation(text: str) -> str:
    """
    Limpia puntuación repetida sin perder estructura básica.
    """
    if not text:
        return ""

    text = re.sub(r"[!?]{2,}", "!", text)
    text = re.sub(r"\.{4,}", "...", text)
    text = re.sub(r",{2,}", ",", text)
    text = re.sub(r";{2,}", ";", text)
    text = re.sub(r":{2,}", ":", text)
    text = re.sub(r"\(\s+", "(", text)
    text = re.sub(r"\s+\)", ")", text)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    text = re.sub(r"([,.;:!?])([^\s\n])", r"\1 \2", text)
    return text.strip()


def _count_words(text: str) -> int:
    """
    Cuenta palabras de forma simple y robusta.
    """
    if not text:
        return 0
    return len(re.findall(r"\b[\w\-/+=]+\b", text, flags=re.UNICODE))


def _count_sentences(text: str) -> int:
    """
    Estimación simple de número de frases/oraciones.
    """
    if not text:
        return 0

    parts = re.split(r"[.!?\n]+", text)
    return len([p for p in parts if p and p.strip()])


def _detect_phrase_hits(text: str, phrases: Sequence[str]) -> List[str]:
    """
    Detecta frases presentes en el texto, sin deduplicados.
    """
    if not text:
        return []

    lowered = text.lower()
    hits: List[str] = []
    seen = set()

    for phrase in phrases:
        candidate = ensure_string(phrase, "").strip().lower()
        if not candidate:
            continue
        if candidate in lowered and candidate not in seen:
            hits.append(candidate)
            seen.add(candidate)

    return hits


def _remove_phrase_hits(text: str, phrases: Sequence[str]) -> Tuple[str, List[str]]:
    """
    Elimina frases completas, con matching case-insensitive, devolviendo:
    - texto limpio
    - lista de frases realmente eliminadas

    Solo se usa para fillers conversacionales de voz.
    """
    if not text:
        return "", []

    cleaned = text
    removed: List[str] = []

    for phrase in phrases:
        candidate = ensure_string(phrase, "").strip()
        if not candidate:
            continue

        pattern = re.compile(
            r"(?<!\w)" + re.escape(candidate) + r"(?!\w)",
            flags=re.IGNORECASE,
        )

        if pattern.search(cleaned):
            cleaned = pattern.sub(" ", cleaned)
            removed.append(candidate.lower())

    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    cleaned = re.sub(r"\s+([,.;:!?])", r"\1", cleaned)
    return cleaned.strip(), removed


def _clean_voice_transcript(text: str) -> Tuple[str, Dict[str, Any]]:
    """
    Limpia transcripciones de voz preservando señales de intención y duda.
    """
    working = text

    filler_hits_before = _detect_phrase_hits(working, VOICE_FILLER_PHRASES)
    self_correction_hits = _detect_phrase_hits(working, VOICE_SELF_CORRECTION_PHRASES)
    fragment_hint_hits = _detect_phrase_hits(working, VOICE_FRAGMENT_HINTS)

    # Eliminamos solo fillers conversacionales blandos.
    working, removed_fillers = _remove_phrase_hits(working, VOICE_FILLER_PHRASES)

    # Compactación ligera tras quitar fillers.
    working = re.sub(r"\b(y|pero|entonces)\s+(y|pero|entonces)\b", r"\1", working, flags=re.IGNORECASE)
    working = re.sub(r"\s{2,}", " ", working)
    working = re.sub(r"\n{2,}", "\n", working)

    voice_meta: Dict[str, Any] = {
        "filler_hits_before": filler_hits_before,
        "filler_hit_count_before": len(filler_hits_before),
        "removed_fillers": removed_fillers,
        "removed_filler_count": len(removed_fillers),
        "self_correction_hits": self_correction_hits,
        "self_correction_hit_count": len(self_correction_hits),
        "fragment_hint_hits": fragment_hint_hits,
        "fragment_hint_count": len(fragment_hint_hits),
    }

    return working.strip(), voice_meta


def _build_normalization_meta(
    input_mode: str,
    raw_text: str,
    normalized_text: str,
    voice_meta: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Construye metadatos serializables de normalización.
    """
    raw_word_count = _count_words(raw_text)
    normalized_word_count = _count_words(normalized_text)
    sentence_count = _count_sentences(normalized_text)

    removed_filler_count = int(voice_meta.get("removed_filler_count", 0))
    self_correction_hit_count = int(voice_meta.get("self_correction_hit_count", 0))
    disfluency_base = max(raw_word_count, 1)
    disfluency_ratio = round((removed_filler_count + self_correction_hit_count) / disfluency_base, 4)

    normalization_applied: List[str] = [
        "unicode_nfkc",
        "line_break_normalization",
        "spacing_compaction",
        "punctuation_compaction",
    ]

    if input_mode == "voice_transcript":
        normalization_applied.append("voice_filler_cleanup")

    meta: Dict[str, Any] = {
        "input_mode": input_mode,
        "raw_length": len(raw_text),
        "normalized_length": len(normalized_text),
        "raw_word_count": raw_word_count,
        "normalized_word_count": normalized_word_count,
        "sentence_count": sentence_count,
        "disfluency_ratio": disfluency_ratio,
        "normalization_applied": normalization_applied,
        "is_empty_after_normalization": normalized_text == "",
    }

    if input_mode == "voice_transcript":
        meta.update(
            {
                "filler_hits_before": voice_meta.get("filler_hits_before", []),
                "filler_hit_count_before": voice_meta.get("filler_hit_count_before", 0),
                "removed_fillers": voice_meta.get("removed_fillers", []),
                "removed_filler_count": removed_filler_count,
                "self_correction_hits": voice_meta.get("self_correction_hits", []),
                "self_correction_hit_count": self_correction_hit_count,
                "fragment_hint_hits": voice_meta.get("fragment_hint_hits", []),
                "fragment_hint_count": voice_meta.get("fragment_hint_count", 0),
            }
        )

    return meta


def normalize_semantic_admission_input(
    input_mode: str,
    raw_input: Any,
) -> Dict[str, Any]:
    """
    Normaliza una entrada libre para la capa de admisión semántica.

    Devuelve:
    {
      "input_mode": "...",
      "normalized_text": "...",
      "normalization_meta": {...}
    }
    """
    resolved_input_mode = _resolve_input_mode(input_mode)
    raw_text = ensure_string(raw_input, "").strip()

    if not raw_text:
        return {
            "input_mode": resolved_input_mode,
            "normalized_text": "",
            "normalization_meta": {
                "input_mode": resolved_input_mode,
                "raw_length": 0,
                "normalized_length": 0,
                "raw_word_count": 0,
                "normalized_word_count": 0,
                "sentence_count": 0,
                "disfluency_ratio": 0.0,
                "normalization_applied": [],
                "is_empty_after_normalization": True,
            },
        }

    working = _normalize_unicode(raw_text)
    working = _normalize_line_breaks(working)

    voice_meta: Dict[str, Any] = {}

    if resolved_input_mode == "voice_transcript":
        working, voice_meta = _clean_voice_transcript(working)

    working = _normalize_spacing(working)
    working = _normalize_punctuation(working)
    working = _normalize_spacing(working)

    normalization_meta = _build_normalization_meta(
        input_mode=resolved_input_mode,
        raw_text=raw_text,
        normalized_text=working,
        voice_meta=voice_meta,
    )

    return {
        "input_mode": resolved_input_mode,
        "normalized_text": working,
        "normalization_meta": normalization_meta,
    }