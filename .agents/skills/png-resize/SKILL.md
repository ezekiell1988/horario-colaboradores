---
name: png-resize
description: >
  Verificar dimensiones de PNG y redimensionarlos con sips (macOS nativo), ImageMagick o Pillow (Python).
  Usar cuando se necesite revisar o ajustar el tamaño de assets PNG, iconos de app,
  imágenes de UI o cualquier archivo PNG antes de incluirlo en un build.
  Incluye recorte de whitespace/transparencia con Pillow (-trim equivalente).
  Triggers: png dimensions, resize png, check image size, sips, imagemagick, pillow, icon size,
  asset too large, ajustar tamaño imagen, verificar dimensiones, redimensionar png, recortar png,
  trim whitespace, espaciado transparente, logo padding, crop transparent.
---

# PNG Resize — Quick Reference

## Herramienta principal: `sips` (macOS built-in)

`sips` viene preinstalado en macOS. No requiere instalación. Disponible en todas las versiones modernas.

```bash
# Verificar que existe
which sips   # → /usr/bin/sips
```

Si por alguna razón no está disponible (muy raro), reinstalar Xcode Command Line Tools:
```bash
xcode-select --install
```

---

## Verificar dimensiones

```bash
# Un solo archivo
sips -g pixelWidth -g pixelHeight /ruta/archivo.png

# Múltiples archivos con glob
sips -g pixelWidth -g pixelHeight /ruta/assets/*.png

# Salida esperada:
# /ruta/assets/ic-call-compra.png
#   pixelWidth: 1024
#   pixelHeight: 1024
```

---

## Redimensionar

### Redimensionar in-place (sobreescribe el original)

```bash
# Un solo archivo
sips --resampleHeightWidth 128 128 /ruta/archivo.png

# Múltiples archivos (espacio-separados)
sips --resampleHeightWidth 128 128 /ruta/a.png /ruta/b.png /ruta/c.png

# Todos los PNG de una carpeta
sips --resampleHeightWidth 128 128 /ruta/assets/*.png
```

### Redimensionar a copia (mantiene original)

```bash
# Crear copia redimensionada
sips --resampleHeightWidth 128 128 /ruta/original.png --out /ruta/output.png

# Crear copia en otra carpeta (conserva nombre)
sips --resampleHeightWidth 128 128 /ruta/original.png --out /ruta/output/
```

### Redimensionar solo por ancho (mantiene proporción)

```bash
sips --resampleWidth 256 /ruta/archivo.png
```

### Redimensionar solo por alto (mantiene proporción)

```bash
sips --resampleHeight 256 /ruta/archivo.png
```

---

## Tamaños recomendados para este proyecto

| Uso | Tamaño recomendado | Notas |
|-----|--------------------|-------|
| Iconos circulares mobile (Ionic) | 128×128 px | Se renderizan a ~52px CSS, 2× para retina |
| Splash screen Capacitor | 2732×2732 px | Mínimo para todas las densidades |
| Logo header | proporcional sin padding | Recortar whitespace primero con Pillow trim |
| Favicon web | 32×32 px | |
| OG image (share) | 1200×630 px | |

---

## Verificar + redimensionar en un solo bloque

Patrón completo: verificar dimensiones, redimensionar si es necesario, confirmar.

```bash
# 1. Verificar tamaño actual
sips -g pixelWidth -g pixelHeight /ruta/assets/icons/*.png

# 2. Redimensionar todos a 128×128
sips --resampleHeightWidth 128 128 /ruta/assets/icons/*.png

# 3. Confirmar resultado
sips -g pixelWidth -g pixelHeight /ruta/assets/icons/*.png
```

---

## Recortar whitespace / transparencia (trim)

`sips` **no puede recortar** — solo redimensiona. Para eliminar el espacio en blanco o transparente alrededor del contenido real de un PNG, usar **Pillow** (Python) o **ImageMagick**.

### Opción A — Pillow (Python, recomendada en este proyecto)

Pillow ya está instalado en el venv del proyecto. Verificar disponibilidad:

```bash
# Instalar si no está
/Users/ezequielbaltodanocubillo/Documents/clickeat/voice-bot/.venv/bin/pip install pillow
```

```python
# Recortar whitespace + agregar padding opcional
from PIL import Image

path = '/ruta/a/archivo.png'
img = Image.open(path).convert('RGBA')
print('original:', img.size)
bbox = img.getbbox()           # bounding box del contenido real (ignora pixels transparentes/blancos)
print('bbox:', bbox)

# Añadir padding alrededor del contenido (opcional)
pad = 8
left   = max(0, bbox[0] - pad)
upper  = max(0, bbox[1] - pad)
right  = min(img.width,  bbox[2] + pad)
lower  = min(img.height, bbox[3] + pad)

cropped = img.crop((left, upper, right, lower))
cropped.save(path, 'PNG')
print('saved:', cropped.size)
```

> **Nota**: `getbbox()` trabaja sobre el canal alfa (transparencia). Si el PNG tiene fondo blanco opaco en lugar de transparente, convertir a RGBA antes (`.convert('RGBA')`) no ayuda — usar ImageMagick con `-trim -fuzz 5%` en ese caso.

### Opción B — ImageMagick (si está instalado)

```bash
brew install imagemagick   # solo si no está

# Recortar transparencia/blanco y guardar sobre el original
convert archivo.png -trim +repage archivo.png

# Con tolerancia de color (útil para fondos casi-blancos)
convert archivo.png -fuzz 5% -trim +repage archivo.png
```

### Cuándo usar trim

- PNG generado por ChatGPT/DALL-E: casi siempre tiene padding grande (canvas 1024×1024, contenido en zona central)
- Logos recibidos de diseñadores con whitespace decorativo
- Iconos con bordes transparentes excesivos que hacen que el CSS tenga que compensar con `height` grande

---

## Alternativa: ImageMagick (si se necesitan operaciones avanzadas)

Instalar si `sips` no cubre el caso (e.g., convertir WEBP→PNG, añadir padding, cambiar fondo):

```bash
brew install imagemagick

# Verificar instalación
magick --version

# Redimensionar con padding (centra el icono en canvas de 128×128)
magick input.png -resize 128x128 -background transparent -gravity center -extent 128x128 output.png

# Convertir WEBP a PNG
magick input.webp output.png

# Convertir SVG a PNG de 128×128
magick -background transparent input.svg -resize 128x128 output.png
```

---

## Checklist antes de incluir un PNG en el build

1. ¿Las dimensiones son las esperadas?
   ```bash
   sips -g pixelWidth -g pixelHeight archivo.png
   ```
2. ¿El archivo tiene fondo transparente (RGBA)? Verificar con:
   ```bash
   sips -g hasAlpha archivo.png
   # → hasAlpha: yes
   ```
3. ¿El tamaño del archivo en disco es razonable?
   ```bash
   ls -lh archivo.png
   # Iconos 128×128: ~5–20 KB está bien. >100 KB es excesivo.
   ```
4. ¿Está en la carpeta `src/assets/` (o subcarpeta) para que el build de Angular lo incluya?

---

## Notas específicas de este proyecto

- Los iconos de tipo `ic-call-*.png` van en `src/VoiceBot.Web/src/assets/icons/`
- `src/assets` está incluida completa en `angular.json` → todo lo que esté ahí sale en el build
- Tamaño recomendado para iconos circulares de cards mobile: **128×128 px**
- Los PNG generados por ChatGPT/DALL-E suelen venir en 1024×1024 — siempre redimensionar antes de commitear
