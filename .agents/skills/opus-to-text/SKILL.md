---
name: opus-to-text
description: >
  Convierte archivos de audio .opus (descargados de WhatsApp) a texto usando Whisper local.
  Produce archivos Markdown con la transcripción en español. Usar cuando se tengan audios
  de WhatsApp que necesiten transcribirse, cuando se pida pasar un audio a texto, o cuando
  se quiera guardar el contenido de un audio como nota escrita.
  Triggers: opus, whatsapp audio, transcribir audio, audio a texto, whisper, convertir audio,
  transcripcion, pasar audio a texto, audio whatsapp, .opus.
compatibility: >
  Requiere Python 3.x, ffmpeg instalado en el sistema (brew install ffmpeg en macOS),
  y el paquete openai-whisper (pip3 install openai-whisper). Solo macOS/Linux.
---

# opus-to-text — Audio WhatsApp → Markdown

Transcribe uno o varios archivos `.opus` de WhatsApp a texto usando **Whisper** de OpenAI
(inferencia local, sin enviar el audio a ningún servicio externo).

---

## Prerrequisitos

```bash
# 1. ffmpeg (necesario para decodificar .opus)
brew install ffmpeg          # macOS

# 2. Whisper
pip3 install openai-whisper
```

Verificar que están disponibles:
```bash
ffmpeg -version | head -1
python3 -c "import whisper; print(whisper.__version__)"
```

---

## Procedimiento

### 1. Un solo archivo

```bash
python3 -c "
import whisper
model = whisper.load_model('base')
result = model.transcribe('ruta/al/audio.opus', language='es')
print(result['text'].strip())
"
```

### 2. Varios archivos en un directorio

Ver el script completo en [examples/transcribe.py](./examples/transcribe.py).

```bash
python3 .agents/skills/opus-to-text/examples/transcribe.py ia/assets output/
```

El script:
- Busca todos los `.opus` en el directorio de entrada.
- Transcribe cada uno con el modelo `base` en español.
- Guarda un `.md` por audio en el directorio de salida.

### 3. Modelos disponibles (velocidad vs. calidad)

| Modelo | RAM aprox. | Velocidad | Calidad |
|--------|-----------|-----------|---------|
| `tiny` | ~1 GB | Muy rápido | Básica |
| `base` | ~1 GB | Rápido | Buena |
| `small` | ~2 GB | Medio | Muy buena |
| `medium` | ~5 GB | Lento | Excelente |
| `large` | ~10 GB | Muy lento | Máxima |

Para audios de WhatsApp en español, **`base` es suficiente**.

---

## Formato de salida esperado

El script crea un `.md` por cada audio:

```markdown
# Transcripción — nombre-del-archivo.opus

**Fecha:** 2026-05-29
**Idioma:** es
**Modelo Whisper:** base

---

Texto transcrito aquí...
```

---

## Notas

- Los archivos `.opus` de WhatsApp no tienen timestamps de segmentos útiles — solo se extrae el texto plano.
- Si el audio tiene ruido de fondo, subir al modelo `small` o `medium` mejora la calidad.
- Whisper descarga el modelo la primera vez (~145 MB para `base`) y lo cachea en `~/.cache/whisper/`.
