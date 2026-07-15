#!/usr/bin/env python3
"""Bump the project version (patch | minor | major) across all version files."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


def parse_version(v: str) -> tuple[int, int, int]:
    parts = v.strip().split(".")
    if len(parts) != 3:
        raise ValueError(f"'{v}' is not a valid semver (expected X.Y.Z)")
    try:
        return (int(parts[0]), int(parts[1]), int(parts[2]))
    except ValueError:
        raise ValueError(f"'{v}' contains non-integer components")


def bump(current: tuple[int, int, int], bump_type: str) -> tuple[int, int, int]:
    maj, min_, pat = current
    if bump_type == "major":
        return (maj + 1, 0, 0)
    if bump_type == "minor":
        return (maj, min_ + 1, 0)
    if bump_type == "patch":
        return (maj, min_, pat + 1)
    raise ValueError(f"Unknown bump type {bump_type!r}. Use: patch, minor, or major.")


def fmt(v: tuple[int, int, int]) -> str:
    return f"{v[0]}.{v[1]}.{v[2]}"



def bump_package_lock(path: Path, new_str: str) -> bool:
    """Update the root version in package-lock.json.

    npm records the project's own version in TWO places -- the top level and
    `packages[""]` -- while every nested dependency keeps its own `version`. Both
    root entries must move or the lockfile drifts from package.json until someone
    happens to run an install.

    Edited as parsed JSON rather than by regex so we address those two keys by
    identity; a lockfile carries ~1000 other "version" keys that must not move.
    """
    raw = path.read_text(encoding="utf-8")
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"    ! package-lock.json is not valid JSON ({e}); skipped.")
        return False

    # npm keeps whatever indentation the lockfile already has -- tabs in some of
    # these repos, two spaces in others -- so read it off the first nested key
    # rather than assuming. Getting this wrong reformats every line.
    m = re.match(r"\{\r?\n([ \t]+)\"", raw)
    indent: str = m.group(1) if m else "  "

    # Refuse to touch the file unless re-serialising reproduces it byte-for-byte,
    # so the diff can only ever be the two version lines. If npm's formatting
    # ever drifts from what json can round-trip, skip rather than rewrite
    # thousands of lines and bury the change in an unreviewable diff.
    if json.dumps(data, indent=indent, ensure_ascii=False) + "\n" != raw:
        print("    ! package-lock.json formatting is not reproducible here;")
        print("      skipped to avoid reformatting the whole file.")
        print("      Sync it with: npm install --package-lock-only")
        return False

    changed = False
    if "version" in data:
        data["version"] = new_str
        changed = True
    root_pkg = data.get("packages", {}).get("")
    if isinstance(root_pkg, dict) and "version" in root_pkg:
        root_pkg["version"] = new_str
        changed = True

    if not changed:
        return False

    path.write_text(json.dumps(data, indent=indent, ensure_ascii=False) + "\n", encoding="utf-8")
    return True

def main() -> None:
    if len(sys.argv) != 2 or sys.argv[1] not in ("patch", "minor", "major"):
        print("Usage: python3 scripts/bump_version.py <patch|minor|major>")
        sys.exit(1)

    bump_type = sys.argv[1]
    root = Path(__file__).parent.parent

    version_file = root / "VERSION"
    if not version_file.exists():
        print("VERSION file not found at repo root.")
        sys.exit(1)

    old_str = version_file.read_text().strip()
    try:
        old = parse_version(old_str)
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)

    new = bump(old, bump_type)
    new_str = fmt(new)
    print(f"Bumping {bump_type}: {old_str} -> {new_str}\n")
    updated: list[str] = []

    version_file.write_text(new_str + "\n")
    updated.append("VERSION")

    package_json = root / "package.json"
    if package_json.exists():
        text = package_json.read_text()
        new_text = re.sub(
            r'"version":\s*"[^"]+"',
            f'"version": "{new_str}"',
            text,
            count=1,
        )
        if new_text != text:
            package_json.write_text(new_text)
            updated.append("package.json")

    package_lock = root / "package-lock.json"
    if package_lock.exists() and bump_package_lock(package_lock, new_str):
        updated.append("package-lock.json")

    print("Updated:")
    for f in updated:
        print(f"    {f}")
    print(f"\nNext: open a PR -- version bump check will validate {old_str} -> {new_str}")


if __name__ == "__main__":
    main()
