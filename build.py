#!/usr/bin/env python3
"""Package the static bicycle display for the Sites worker runtime."""

from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
ASSETS = DIST / "assets"


def main() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)

    ASSETS.mkdir(parents=True)
    shutil.copy2(ROOT / "index.html", ASSETS / "index.html")
    shutil.copy2(ROOT / "styles.css", ASSETS / "styles.css")
    shutil.copy2(ROOT / "app.js", ASSETS / "app.js")
    (DIST / "server").mkdir()
    shutil.copy2(ROOT / "worker" / "index.js", DIST / "server" / "index.js")
    print(f"Built {DIST}")


if __name__ == "__main__":
    main()
