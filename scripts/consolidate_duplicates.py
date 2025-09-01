#!/usr/bin/env python3
"""Consolidate duplicate/backup/regen variants of files.

This script groups files by their canonical base name (stripping any ".regen" suffixes and ".bak") and
moves non-canonical duplicates into a timestamped backups directory. By default it performs a dry-run
and prints the planned actions. Run with --apply to perform the moves.

Usage:
  python scripts\consolidate_duplicates.py        # dry-run
  python scripts\consolidate_duplicates.py --apply

The script will not modify files inside existing "backups" directories and is safe to run multiple times.
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple


def canonical_base(path: Path) -> Path:
    """Return the canonical base path for a file by stripping ".regen" segments and trailing ".bak".

    For example:
      - album_template.html.regen.html.regen.html -> album_template.html
      - file.html.bak -> file.html
    """
    name = path.name
    # split at first .regen occurrence
    if ".regen" in name:
        name = name.split(".regen", 1)[0]
    # strip trailing .bak
    if name.endswith('.bak'):
        name = name[:-4]
    # collapse repeated .html (e.g., name.html.html -> name.html)
    # but only if it ends with multiple .html
    if name.count('.html') > 1:
        # keep up to the first .html
        idx = name.find('.html')
        name = name[: idx + len('.html')]
    return path.with_name(name)


def find_groups(root: Path) -> Dict[Path, List[Path]]:
    groups: Dict[Path, List[Path]] = {}
    for p in root.rglob('*'):
        if not p.is_file():
            continue
        # skip inside backups to avoid churn
        if any(part.lower().startswith('backups') for part in p.parts):
            continue
        base = canonical_base(p)
        groups.setdefault(base, []).append(p)
    return groups


def choose_canonical(base: Path, members: List[Path]) -> Path:
    # Prefer exact basename match if present
    for p in members:
        if p.name == base.name:
            return p
    # Prefer non-.bak and minimal suffix count
    def score(p: Path) -> Tuple[int, float]:
        s = 0
        if p.name.endswith('.bak'):
            s += 10
        s += p.name.count('.regen')
        mtime = p.stat().st_mtime
        # lower score preferred; for tiebreaker prefer newest (negate mtime)
        return (s, -mtime)

    return sorted(members, key=score)[0]


def plan_actions(groups: Dict[Path, List[Path]]) -> List[Tuple[Path, Path]]:
    """Return list of (src, dest) moves to consolidate duplicates into backups."""
    actions: List[Tuple[Path, Path]] = []
    for base, members in groups.items():
        if len(members) <= 1:
            continue
        canonical = choose_canonical(base, members)
        for p in members:
            if p == canonical:
                continue
            actions.append((p, canonical))
    return actions


def perform_moves(actions: List[Tuple[Path, Path]], root: Path) -> Path:
    now = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = root / 'backups' / f'duplicates_consolidation_{now}'
    backup_dir.mkdir(parents=True, exist_ok=True)
    report_lines: List[str] = []
    for src, canonical in actions:
        # move src into backup_dir, preserving relative path
        try:
            rel = src.relative_to(root)
        except Exception:
            rel = Path(src.name)
        dest = backup_dir / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(dest))
        line = f'MOVED: {src} -> {dest} (canonical kept: {canonical})'
        print(line)
        report_lines.append(line)

    report_file = backup_dir / 'report.txt'
    report_file.write_text('\n'.join(report_lines), encoding='utf-8')
    return backup_dir


def main(argv=None):
    parser = argparse.ArgumentParser(description='Consolidate duplicate/backup/regen variants of files')
    parser.add_argument('--apply', action='store_true', help='Perform moves. Without this, a dry-run is shown.')
    parser.add_argument('--root', type=str, default='.', help='Root path to scan (default: current directory)')
    args = parser.parse_args(argv)

    root = Path(args.root).resolve()
    print(f'Scanning root: {root}')
    groups = find_groups(root)
    duplicates = {b: m for b, m in groups.items() if len(m) > 1}
    if not duplicates:
        print('No duplicate groups found. Nothing to do.')
        return 0

    print(f'Found {len(duplicates)} duplicate groups. Showing plan:')
    actions = plan_actions(duplicates)
    if not actions:
        print('No moves planned (already canonical).')
        return 0

    for src, canonical in actions:
        print(f'  - Keep: {canonical}
    Move duplicate: {src}')

    if not args.apply:
        print('\nDry-run complete. Re-run with --apply to perform the moves.')
        return 0

    print('\nApplying moves...')
    backup_dir = perform_moves(actions, root)
    print(f'All duplicates moved into: {backup_dir}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
