#!/usr/bin/env python3
"""
transcribe.py — Convierte archivos .opus de WhatsApp a Markdown con Whisper.

Uso:
    python3 transcribe.py <directorio_entrada> [directorio_salida] [modelo]

Ejemplos:
    python3 transcribe.py ia/assets/
    python3 transcribe.py ia/assets/ ia/assets/ small
    python3 transcribe.py ia/assets/ output/ base

Si no se indica directorio_salida, se usa el mismo que el de entrada.
Modelos disponibles: tiny, base, small, medium, large (default: base)
"""

import sys
import os
from pathlib import Path
from datetime import date

try:
    import whisper
except ImportError:
    print("ERROR: openai-whisper no está instalado.")
    print("       Ejecuta: pip3 install openai-whisper")
    sys.exit(1)


def transcribe_files(input_dir: str, output_dir: str, model_name: str = "base") -> None:
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    opus_files = sorted(input_path.glob("*.opus"))
    if not opus_files:
        print(f"No se encontraron archivos .opus en: {input_path}")
        return

    print(f"Cargando modelo Whisper '{model_name}'...")
    model = whisper.load_model(model_name)

    today = date.today().isoformat()

    for audio_file in opus_files:
        print(f"Transcribiendo: {audio_file.name} ...", end=" ", flush=True)
        result = model.transcribe(str(audio_file), language="es")
        text = result["text"].strip()

        md_filename = audio_file.stem + ".md"
        md_path = output_path / md_filename

        md_content = f"""# Transcripción — {audio_file.name}

**Fecha:** {today}
**Idioma:** es
**Modelo Whisper:** {model_name}

---

{text}
"""
        md_path.write_text(md_content, encoding="utf-8")
        print(f"guardado → {md_path}")

    print(f"\nListo. {len(opus_files)} archivo(s) transcrito(s) en: {output_path}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    input_dir = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else input_dir
    model_name = sys.argv[3] if len(sys.argv) > 3 else "base"

    transcribe_files(input_dir, output_dir, model_name)
