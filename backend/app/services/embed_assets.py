"""Resolve files of the embed bundle. Rejects paths that leave the bundle directory."""

from pathlib import Path


def resolve_embed_asset(root: Path, asset_path: str) -> Path | None:
    if not isinstance(asset_path, str) or not asset_path or asset_path.startswith(("/", "\\")):
        return None
    if "\\" in asset_path or "\x00" in asset_path:
        return None
    parts = [part for part in asset_path.split("/") if part]
    if not parts or any(part.startswith(".") or part in {"..", "."} for part in parts):
        return None
    base = root.resolve()
    candidate = (base.joinpath(*parts)).resolve()
    if not candidate.is_relative_to(base) or not candidate.is_file():
        return None
    if candidate.suffix == ".map" or candidate.name.startswith("."):
        return None
    return candidate
