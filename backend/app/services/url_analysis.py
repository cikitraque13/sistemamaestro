from typing import Any, Dict
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup


async def fetch_and_analyze_url(url: str) -> Dict[str, Any]:
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    parsed = urlparse(url)
    if not parsed.netloc:
        return {"success": False, "error": "URL no válida"}

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as http_client:
            resp = await http_client.get(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            )

            if resp.status_code >= 400:
                return {
                    "success": False,
                    "error": f"No se pudo acceder a la web (código {resp.status_code})"
                }

            soup = BeautifulSoup(resp.text, "html.parser")

            title = soup.title.string.strip() if soup.title and soup.title.string else "Sin título"

            meta_desc = ""
            meta_tag = soup.find("meta", attrs={"name": "description"})
            if meta_tag:
                meta_desc = meta_tag.get("content", "")

            h1 = [tag.get_text(strip=True) for tag in soup.find_all("h1")][:5]
            h2 = [tag.get_text(strip=True) for tag in soup.find_all("h2")][:10]

            paragraphs = [
                p.get_text(strip=True)
                for p in soup.find_all("p")
                if len(p.get_text(strip=True)) > 30
            ][:5]

            ctas = []
            for a in soup.find_all("a", href=True):
                text = a.get_text(strip=True).lower()
                if any(
                    word in text
                    for word in [
                        "comprar",
                        "buy",
                        "sign up",
                        "registr",
                        "empieza",
                        "start",
                        "contact",
                        "demo",
                        "free",
                        "gratis",
                        "prueba",
                    ]
                ):
                    ctas.append(a.get_text(strip=True))

            for btn in soup.find_all("button"):
                text = btn.get_text(strip=True)
                if text:
                    ctas.append(text)

            ctas = list(set(ctas))[:10]

            forms = len(soup.find_all("form"))
            nav_items = [a.get_text(strip=True) for a in soup.find_all("nav")][:5]

            return {
                "success": True,
                "content": {
                    "url": url,
                    "domain": parsed.netloc,
                    "title": title,
                    "meta_description": meta_desc,
                    "h1": h1,
                    "h2": h2,
                    "main_text": paragraphs,
                    "ctas": ctas,
                    "forms_count": forms,
                    "navigation": nav_items,
                },
            }

    except httpx.TimeoutException:
        return {"success": False, "error": "Tiempo de espera agotado al acceder a la URL"}
    except httpx.ConnectError:
        return {"success": False, "error": "No se pudo conectar con el servidor"}
    except Exception as e:
        return {"success": False, "error": f"Error al analizar la URL: {str(e)}"}
