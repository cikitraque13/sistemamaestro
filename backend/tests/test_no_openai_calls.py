"""Fail if application code still imports or calls OpenAI."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SCAN_FILES = [
    ROOT / "backend" / "requirements.txt",
    ROOT / ".env.example",
    ROOT / "backend" / ".env.example",
    ROOT / "README.md",
    ROOT / "DEPLOY_RAILWAY.md",
    ROOT / "docs" / "architecture" / "04-runtime-and-deploy-truth.md",
]
SCAN_DIRS = [ROOT / "backend" / "app", ROOT / "frontend" / "src"]
PATTERN = re.compile(
    r"openai|OPENAI_API_KEY|api\.openai\.com|AsyncOpenAI|gpt-4o|gpt-3\.5|text-embedding",
    re.IGNORECASE,
)


def _files():
    for path in SCAN_FILES:
        if path.is_file():
            yield path
    for directory in SCAN_DIRS:
        for path in directory.rglob("*"):
            if path.suffix.lower() in {".py", ".js", ".jsx", ".mjs"} and path.is_file():
                yield path


def test_no_source_imports_or_calls_openai():
    hits = []
    for path in _files():
        text = path.read_text(encoding="utf-8", errors="replace")
        if PATTERN.search(text):
            hits.append(str(path.relative_to(ROOT)))
    assert hits == []
