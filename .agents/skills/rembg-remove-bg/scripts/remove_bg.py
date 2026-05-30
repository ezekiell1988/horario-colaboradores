#!/usr/bin/env python3
"""
remove_bg.py — Elimina el fondo de PNGs usando rembg (U2Net IA).

Uso:
    python3 remove_bg.py <ruta>            # archivo o carpeta (in-place)
    python3 remove_bg.py <ruta> --out DIR  # guarda copias en DIR
    python3 remove_bg.py <ruta> --model isnet-general-use
    python3 remove_bg.py <ruta> --dry-run  # solo muestra qué procesaría
"""

import sys
import argparse
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Elimina el fondo de PNGs con rembg (IA U2Net)."
    )
    parser.add_argument(
        "path",
        help="Archivo PNG, carpeta con PNGs, o patrón glob (ej: assets/cleo/*.png)",
    )
    parser.add_argument(
        "--out",
        metavar="DIR",
        default=None,
        help="Carpeta de salida. Si no se indica, sobreescribe el original.",
    )
    parser.add_argument(
        "--model",
        default="u2net",
        choices=["u2net", "u2net_human_seg", "isnet-general-use", "silueta"],
        help="Modelo rembg a usar (default: u2net).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Muestra qué archivos se procesarían sin ejecutar nada.",
    )
    return parser.parse_args()


def collect_files(path_str: str) -> list[Path]:
    """Devuelve lista de PNGs a procesar a partir de archivo, carpeta o glob."""
    p = Path(path_str)

    if p.is_file():
        if p.suffix.lower() != ".png":
            print(f"WARN: {p.name} no es PNG, se omite.")
            return []
        return [p]

    if p.is_dir():
        files = sorted(p.glob("*.png"))
        if not files:
            print(f"WARN: No se encontraron PNGs en {p}")
        return files

    # Glob relativo al cwd
    from glob import glob
    matches = sorted(glob(path_str))
    return [Path(m) for m in matches if Path(m).suffix.lower() == ".png"]


def process(files: list[Path], out_dir: Path | None, model: str, dry_run: bool) -> None:
    if not files:
        print("No hay archivos para procesar.")
        return

    if out_dir:
        out_dir.mkdir(parents=True, exist_ok=True)

    # Importar rembg aquí para que el --dry-run no requiera la dependencia
    if not dry_run:
        try:
            from rembg import remove, new_session
            from PIL import Image
            session = new_session(model)
        except ImportError:
            print("ERROR: rembg no está instalado. Ejecuta: pip install rembg[cpu]")
            sys.exit(1)

    total = len(files)
    ok = 0
    errors = 0

    for i, src in enumerate(files, 1):
        dest = (out_dir / src.name) if out_dir else src
        prefix = f"[{i}/{total}] {src.name}"

        if dry_run:
            arrow = f"→ {dest}" if out_dir else "(in-place)"
            print(f"  {prefix}  {arrow}")
            continue

        try:
            img = Image.open(src).convert("RGBA")
            result = remove(img, session=session)
            result.save(dest)
            print(f"  {prefix} ... OK")
            ok += 1
        except Exception as e:
            print(f"  {prefix} ... ERROR: {e}")
            errors += 1

    if not dry_run:
        print(f"\nResultado: {ok} OK, {errors} errores de {total} archivos.")


def main() -> None:
    args = parse_args()
    files = collect_files(args.path)

    if args.dry_run:
        print(f"[dry-run] Modelo: {args.model} | Archivos encontrados: {len(files)}")
    else:
        print(f"Procesando {len(files)} archivo(s) con modelo '{args.model}'...")

    out_dir = Path(args.out) if args.out else None
    process(files, out_dir, args.model, args.dry_run)


if __name__ == "__main__":
    main()
