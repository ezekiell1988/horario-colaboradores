---
name: my-mac
description: >
  Diagnóstico, optimización y reporte de salud del Mac. El skill conoce el Mac 100%,
  identifica qué se puede liberar o mejorar, ejecuta las optimizaciones, y genera un reporte HTML
  con antes/realizado/después en reports/. Cubre Docker, espacio en disco, npm, Xcode DerivedData,
  ChatGPT cache, Homebrew, CocoaPods, JetBrains, logs y tareas de limpieza periódica.
  Triggers: limpiar docker, liberar espacio, docker prune, build cache, espacio en disco,
  mantenimiento mac, docker system df, imágenes docker, docker cleanup, npm cache, node_modules,
  homebrew cleanup, brew cleanup, mac lento, rendimiento mac, limpiar logs, limpiar caché,
  disco lleno, storage mac, macOS maintenance, ncdu, explorar disco, disk usage, navegador disco,
  reporte mac, optimizar mac, diagnóstico mac, cuánto espacio tengo, limpieza mac, reporte html.
---

# Mantenimiento del Mac — Entorno de Desarrollo

## Objetivo del skill

Este skill tiene **tres fases que siempre se ejecutan en orden**:

1. **Diagnosticar** — conocer el estado real del Mac: espacio libre, qué carpetas son las más grandes, qué se puede limpiar de forma segura.
2. **Optimizar** — ejecutar las limpiezas identificadas (Docker, Xcode, npm, caches, etc.).
3. **Reportar** — generar un reporte HTML amigable en `reports/` con nombre `YYYYMMDDHHMI.html` que muestra antes, qué se realizó y después. Ver instrucciones en [`references/report-template.md`](./references/report-template.md).

> ⚠️ **El reporte HTML es el output final obligatorio de cada corrida del skill.** No cerrar la sesión sin haberlo generado.

---

## Referencias

- [references/docker-cleanup.md](./references/docker-cleanup.md) — Docker: estado real, comandos, flujo
- [references/mac-maintenance.md](./references/mac-maintenance.md) — npm, Homebrew, caches, logs, Xcode, ChatGPT
- [references/ncdu.md](./references/ncdu.md) — ncdu: instalación, navegación, atajos, casos de uso
- [references/report-template.md](./references/report-template.md) — cómo generar el reporte HTML final

---

## Diagnóstico rápido de Docker

```bash
docker system df
```

Muestra 4 categorías: **Images**, **Containers**, **Local Volumes**, **Build Cache**.
La columna **RECLAIMABLE** indica cuánto se puede recuperar de forma segura.

---

## Limpieza por nivel (de más seguro a más agresivo)

### Nivel 1 — Solo build cache (recomendado, ~20 GB típico)
```bash
docker builder prune -f
```
- Seguro: no toca imágenes ni contenedores activos.
- El build cache restante (~3-4 GB) son layers base que Docker reutiliza.

### Nivel 2 — Build cache + contenedores/volúmenes detenidos
```bash
docker system prune -f
```
- Elimina: build cache + contenedores detenidos + redes no usadas.
- **No** elimina imágenes.

### Nivel 3 — Todo excepto imágenes activas en uso
```bash
docker system prune -f --volumes
```
- Agrega volúmenes anónimos no usados.

### Nivel 4 — Limpieza total (agresivo)
```bash
docker system prune -a -f
```
- Borra **todas** las imágenes que no estén en un contenedor corriendo.
- Las imágenes de roll-manager y voice-bot se tienen que reconstruir o re-pullear.
- ⚠️ Usar solo si hay mucho espacio ocupado y no hay builds activos en la VM.

---

## Imágenes conocidas en este Mac

| Imagen | Tag | Tamaño | Activa |
|--------|-----|--------|--------|
| `roll-manager-green-image` | latest | ~192 MB | Sí (producción VM) |
| `voice-bot` / `voice-bot-voicebot-api` | latest | ~648 MB | No |
| `acrclickeat.azurecr.io/voice-bot` | varios | ~134-648 MB | No |
| `acrclickeat.azurecr.io/api-service` | latest | ~488 MB | No |
| `redis` | alpine / 7-alpine | ~62-130 MB | No |
| `acroneononedev.azurecr.io/clickeat-yafit` | varios | ~24 MB | No |

Para limpiar solo imágenes no usadas (dangling):
```bash
docker image prune -f
```

Para limpiar imágenes no activas por nombre:
```bash
docker rmi $(docker images "voice-bot" -q)
```

---

## Flujo recomendado de mantenimiento periódico

1. `docker system df` — revisar qué ocupa más
2. `docker builder prune -f` — limpiar build cache (siempre seguro)
3. Si quedan imágenes viejas: `docker image prune -f`
4. Verificar con `docker system df` que el espacio bajó

---

## Más áreas de limpieza en el Mac

Ver referencia completa: [references/mac-maintenance.md](./references/mac-maintenance.md)

### npm / Node.js
```bash
npm cache clean --force        # limpiar caché global de npm
npx npkill                     # herramienta interactiva para borrar node_modules huérfanos
```

### Homebrew
```bash
brew cleanup -s                # borrar versiones viejas de fórmulas y casks
brew autoremove                # borrar dependencias no usadas
brew doctor                    # detectar problemas de configuración
```

### Caché del sistema macOS
```bash
du -sh ~/Library/Caches        # ver tamaño total de caches
du -sh ~/Library/Caches/* | sort -h | tail -20   # top 20 por tamaño
```
Borrar manualmente: Finder → ⇧⌘G → `~/Library/Caches` → borrar carpetas seguras.

### Logs
```bash
du -sh ~/Library/Logs
du -sh /private/var/log
```

### Xcode / Simuladores (si aplica)
```bash
xcrun simctl delete unavailable   # borrar simuladores viejos
du -sh ~/Library/Developer/Xcode/DerivedData
```

### Revisar disco global
```bash
du -sh ~/* 2>/dev/null | sort -h  # qué carpeta del home ocupa más
df -h                              # espacio por volumen
```

### ncdu — explorador interactivo de disco (recomendado)
```bash
brew install ncdu   # solo la primera vez
ncdu ~              # explorar home
ncdu /              # explorar todo el sistema
```
Ver guía completa: [references/ncdu.md](./references/ncdu.md)