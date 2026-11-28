"""Deterministic self-critique. Generic copy fails before the model judge."""
import re
import unicodedata

from backend.app.services.builder_system_prompt import BANNED_PHRASES, PLACEHOLDER_TITLES

_WORD = re.compile(r"[a-z0-9]{4,}")
STOPWORDS = frozenset({
    "para", "esta", "este", "esto", "estos", "estas", "como", "donde", "cuando",
    "porque", "desde", "hasta", "entre", "sobre", "tiene", "tienen", "hacer",
    "quiero", "quiere", "quieren", "quieres", "tenemos", "tienes", "cambio",
    "landing", "pagina", "sitio", "negocio", "empresa", "nuestro", "nuestra",
    "nuestros", "nuestras", "vuestro", "vuestra", "cliente", "clientes",
    "servicio", "servicios", "texto", "plantilla", "ejemplo", "quiero",
    "hacer", "tiene", "desde", "hacia", "tambien", "además", "ademas",
    "mejor", "mejores", "calidad", "soluciones", "innovadoras",
})
GENERIC_CTAS = frozenset({
    "saber mas", "saber más", "contactar", "enviar", "click aqui", "clic aqui",
    "empezar", "continuar", "mas informacion", "más información", "suscribete",
    "suscríbete", "compra ahora", "click aquí", "clic aquí",
})


def fold(value) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(char for char in text if not unicodedata.combining(char))
    return text.lower()


def _blob(parts) -> str:
    return fold(" ".join(str(part or "") for part in parts))


def draft_text(draft) -> str:
    sections = (draft or {}).get("sections") or []
    chunks = [
        (draft or {}).get("title"),
        (draft or {}).get("subtitle"),
        (draft or {}).get("cta"),
    ]
    for item in sections:
        if isinstance(item, dict):
            chunks.append(item.get("title"))
            chunks.append(item.get("text"))
    return _blob(chunks)


def business_terms(context) -> list:
    context = context or {}
    intent = context.get("intent") if isinstance(context.get("intent"), dict) else {}
    plan = context.get("plan") if isinstance(context.get("plan"), dict) else {}
    project = context.get("project") if isinstance(context.get("project"), dict) else {}
    diagnosis = project.get("diagnosis") if isinstance(project.get("diagnosis"), dict) else {}
    priorities = plan.get("priorities") if isinstance(plan.get("priorities"), list) else []
    blob = _blob([
        context.get("instruction"),
        intent.get("title"),
        intent.get("goal"),
        plan.get("title"),
        plan.get("summary"),
        " ".join(str(item) for item in priorities),
        project.get("input_content"),
        diagnosis.get("summary"),
    ])
    found = []
    for word in _WORD.findall(blob):
        if word in STOPWORDS or word in found:
            continue
        found.append(word)
    return found


def critique_copy(draft, context) -> dict:
    """Return ok False when the page could be any business."""
    text = draft_text(draft)
    folded_banned = [fold(phrase) for phrase in BANNED_PHRASES]
    if any(phrase and phrase in text for phrase in folded_banned):
        return {"ok": False, "summary": "El texto usa una frase de plantilla."}
    terms = business_terms(context)
    if not terms or not any(term in text for term in terms):
        return {"ok": False, "summary": "El texto no nombra el negocio ni el oficio del encargo."}
    sections = [item for item in (draft or {}).get("sections") or [] if isinstance(item, dict)]
    titles = [fold(item.get("title")).strip() for item in sections if fold(item.get("title")).strip()]
    if len(titles) < 1 or len(set(titles)) != len(titles):
        return {"ok": False, "summary": "Las secciones no son distintas."}
    for item in sections:
        title = fold(item.get("title")).strip()
        body = fold(item.get("text"))
        if title in {fold(name) for name in PLACEHOLDER_TITLES} and not any(term in body or term in title for term in terms):
            return {"ok": False, "summary": "Hay una sección de plantilla sin el oficio."}
    cta = fold((draft or {}).get("cta")).strip()
    if not cta or cta in {fold(item) for item in GENERIC_CTAS}:
        return {"ok": False, "summary": "El botón no dice el siguiente paso de este negocio."}
    return {"ok": True, "summary": "El texto habla de este negocio."}
