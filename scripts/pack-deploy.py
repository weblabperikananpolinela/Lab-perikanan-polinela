#!/usr/bin/env python3
"""Pack deployment ZIP untuk hosting Plesk Polinela.

Mengikuti pola yang terbukti dari deploy v5.0.2:
  app.js            <- .next/standalone/server.js (launcher Passenger)
  package.json      <- package.json root
  .next/            <- seluruh .next KECUALI cache/dev/diagnostics/standalone/types/trace*
  public/           <- seluruh public/
  node_modules/     <- hasil trace .next/standalone/node_modules

Pemakaian: python scripts/pack-deploy.py
Output: deploy-dolphin-<BUILD_ID>.zip (di root proyek) + SHA-256.
"""

import hashlib
import os
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD_ID = (ROOT / '.next' / 'BUILD_ID').read_text(encoding='utf-8').strip()

# Bagian .next yang tidak ikut deploy (cache lokal, dev, output standalone
# sendiri, dan file trace).
SKIP_NEXT_DIRS = {
    '.next/cache',
    '.next/dev',
    '.next/diagnostics',
    '.next/standalone',
    '.next/types',
}
SKIP_NEXT_FILES_PREFIX = ('.next/trace',)


def is_skipped(rel_posix: str) -> bool:
    for d in SKIP_NEXT_DIRS:
        if rel_posix == d or rel_posix.startswith(d + '/'):
            return True
    for p in SKIP_NEXT_FILES_PREFIX:
        if rel_posix.startswith(p):
            return True
    return False


def main() -> None:
    print(f'BUILD_ID: {BUILD_ID}')

    # Launcher Passenger = standalone server.js, di-rename app.js.
    shutil.copy2(ROOT / '.next' / 'standalone' / 'server.js', ROOT / 'app.js')

    zip_name = f'deploy-dolphin-{BUILD_ID}.zip'
    zip_path = ROOT / zip_name
    if zip_path.exists():
        zip_path.unlink()

    added = 0
    raw = 0
    with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for f in ('app.js', 'package.json'):
            zf.write(ROOT / f, f)
            added += 1
            raw += (ROOT / f).stat().st_size

        nxt = ROOT / '.next'
        for dirpath, dirnames, filenames in os.walk(nxt):
            rel_dir = os.path.relpath(dirpath, ROOT).replace(os.sep, '/')
            dirnames[:] = [
                d for d in dirnames if not is_skipped(f'{rel_dir}/{d}')
            ]
            for fn in filenames:
                full = Path(dirpath) / fn
                rel = os.path.relpath(full, ROOT).replace(os.sep, '/')
                if is_skipped(rel):
                    continue
                zf.write(full, rel)
                added += 1
                raw += full.stat().st_size

        pub = ROOT / 'public'
        for dirpath, _dirnames, filenames in os.walk(pub):
            for fn in filenames:
                full = Path(dirpath) / fn
                rel = os.path.relpath(full, ROOT).replace(os.sep, '/')
                zf.write(full, rel)
                added += 1
                raw += full.stat().st_size

        nm = ROOT / '.next' / 'standalone' / 'node_modules'
        for dirpath, _dirnames, filenames in os.walk(nm):
            for fn in filenames:
                full = Path(dirpath) / fn
                rel = 'node_modules/' + os.path.relpath(full, nm).replace(os.sep, '/')
                zf.write(full, rel)
                added += 1
                raw += full.stat().st_size

    digest = hashlib.sha256()
    with open(zip_path, 'rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            digest.update(chunk)

    print(f'files   : {added}')
    print(f'raw     : {raw / 1024 / 1024:.1f} MB')
    print(f'zip     : {zip_name} ({zip_path.stat().st_size / 1024 / 1024:.1f} MB)')
    print(f'sha256  : {digest.hexdigest()}')


if __name__ == '__main__':
    main()
