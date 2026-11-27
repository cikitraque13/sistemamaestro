"""Cabeceras de caché del frontend estático.

El HTML de la portada no debe quedarse en el navegador: un index.html viejo
sigue apuntando al JavaScript anterior. Los ficheros con hash bajo /assets/
sí pueden cachearse mucho tiempo.
"""

NO_STORE = "no-cache, no-store, must-revalidate"
IMMUTABLE = "public, max-age=31536000, immutable"


def cache_control_for(relative_path: str) -> str:
    normalized = str(relative_path or "").replace("\\", "/").lstrip("/")
    if normalized.startswith("assets/"):
        return IMMUTABLE
    return NO_STORE
