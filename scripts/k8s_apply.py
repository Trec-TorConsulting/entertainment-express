#!/usr/bin/env python3
"""Filter k8s-deployment.yaml for an existing-cluster apply.

Omits kind: Job always. Optionally omits StatefulSet/mariadb when that STS already exists.
Prints filtered YAML to stdout. Comments on stderr when --dry-run.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def iter_documents(text: str) -> list[str]:
    parts = re.split(r"^---\s*$", text, flags=re.MULTILINE)
    docs: list[str] = []
    for part in parts:
        if re.search(r"^kind:\s*\S+", part, flags=re.MULTILINE):
            docs.append(part.strip("\n") + "\n")
    return docs


def kind_and_name(doc: str) -> tuple[str | None, str | None]:
    kind = None
    name = None
    in_metadata = False
    for line in doc.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if re.match(r"^kind:\s*", line):
            kind = line.split(":", 1)[1].strip()
            continue
        if re.match(r"^metadata:\s*$", line):
            in_metadata = True
            continue
        if in_metadata:
            if re.match(r"^  name:\s*", line):
                name = line.split(":", 1)[1].strip().strip("\"'")
                break
            if line and not line.startswith(" ") and not line.startswith("\t"):
                break
    return kind, name


def should_omit(kind: str | None, name: str | None, skip_mariadb: bool) -> str | None:
    if kind == "Job":
        return f"Job/{name or '?'}"
    if skip_mariadb and kind == "StatefulSet" and name == "mariadb":
        return "StatefulSet/mariadb"
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "manifest",
        nargs="?",
        default=str(Path(__file__).resolve().parent.parent / "k8s-deployment.yaml"),
        help="Path to k8s-deployment.yaml",
    )
    parser.add_argument(
        "--skip-mariadb",
        action="store_true",
        help="Omit StatefulSet/mariadb (use when it already exists on the cluster)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Write filtered YAML to stdout; list omitted resources on stderr",
    )
    args = parser.parse_args()

    text = Path(args.manifest).read_text(encoding="utf-8")
    kept: list[str] = []
    omitted: list[str] = []
    for doc in iter_documents(text):
        kind, name = kind_and_name(doc)
        reason = should_omit(kind, name, args.skip_mariadb)
        if reason:
            omitted.append(reason)
            continue
        kept.append(doc)

    sys.stdout.write("---\n" + "\n---\n".join(kept))
    if not kept[-1].endswith("\n"):
        sys.stdout.write("\n")

    if args.dry_run or omitted:
        print(
            "omitted: " + (", ".join(omitted) if omitted else "(none)"),
            file=sys.stderr,
        )
        print(f"kept {len(kept)} documents", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
