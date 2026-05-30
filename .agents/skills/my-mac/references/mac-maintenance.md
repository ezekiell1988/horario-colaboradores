# Mantenimiento macOS — Referencia Técnica

## Diagnóstico de espacio (punto de partida)

```bash
# Espacio disponible por volumen
df -h

# Top 10 carpetas más grandes en el home
du -sh ~/* 2>/dev/null | sort -h | tail -10

# Tamaño total de caches del usuario
du -sh ~/Library/Caches
```

---

## npm / Node.js

### Caché de npm
```bash
npm cache verify          # revisar integridad
npm cache clean --force   # limpiar todo (~1-3 GB en proyectos activos)
du -sh ~/.npm             # ver tamaño actual
```

### node_modules huérfanos
Proyectos viejos dejan `node_modules` intactos. La herramienta **npkill** los lista y borra interactivamente:
```bash
npx npkill               # escanea desde el directorio actual
# ↑ usa espacio/borra, q para salir
```

### Versiones de Node con nvm
```bash
nvm ls                   # ver versiones instaladas
nvm uninstall <version>  # borrar versión que ya no se usa
```

---

## Homebrew

```bash
brew cleanup -s                  # borrar versiones antiguas de fórmulas y casks
brew autoremove                  # borrar dependencias no requeridas
brew doctor                      # detectar problemas

# Ver qué ocupa más
du -sh $(brew --cellar)/*        # fórmulas instaladas
du -sh $(brew --caskroom)/*      # casks (apps) instaladas
```

**Cuándo usar:** cada mes, o cuando `brew` avise de espacio.

---

## Caches del sistema macOS

### Ver y limpiar
```bash
du -sh ~/Library/Caches
du -sh ~/Library/Caches/* 2>/dev/null | sort -h | tail -20
```

Candidatos seguros a borrar manualmente (no afectan funcionamiento):
- `~/Library/Caches/com.apple.dt.Xcode` — cache Xcode
- `~/Library/Caches/org.chromium.*` — Chrome/Edge/Brave
- `~/Library/Caches/pip` — Python pip
- `~/Library/Caches/com.microsoft.VSCode` — VS Code
- `~/Library/Caches/com.openai.atlas` — ChatGPT Desktop (~1.6 GB, se regenera al abrir la app)

> No borrar `~/Library/Caches/com.apple.IconServices` ni los de iCloud/CloudKit.

### Cache de pip
```bash
pip cache purge
du -sh ~/Library/Caches/pip
```

---

## Logs del sistema

```bash
du -sh ~/Library/Logs              # logs de apps del usuario
du -sh /private/var/log            # logs del sistema (requiere sudo)

# Limpiar logs del sistema (macOS lo hace automáticamente, pero se puede forzar)
sudo log erase --all               # borra todos los logs persistentes
```

---

## Xcode y simuladores iOS (si aplica)

```bash
# Simuladores no disponibles
xcrun simctl delete unavailable

# DerivedData (cache de compilación Xcode) — seguro borrar
rm -rf ~/Library/Developer/Xcode/DerivedData
du -sh ~/Library/Developer/Xcode/DerivedData

# Archives viejos
du -sh ~/Library/Developer/Xcode/Archives
```

---

## Archivos de soporte de apps

```bash
du -sh ~/Library/Application\ Support/* | sort -h | tail -20
```

Candidatos: carpetas de apps desinstaladas que quedan huérfanas.

---

## Herramientas recomendadas (gratuitas)

| Herramienta | Uso | Instalación |
|-------------|-----|-------------|
| `ncdu` | Explorador de disco por terminal | `brew install ncdu` |
| `npkill` | Borrar node_modules | `npx npkill` |
| `dust` | Alternativa visual a `du` | `brew install dust` |
| **Storage → macOS Settings** | Vista nativa de "Administrar almacenamiento" | Ajustes del Sistema → General → Almacenamiento |

### ncdu (recomendado para explorar)
```bash
brew install ncdu
ncdu ~          # explorar home interactivamente
# ↑ navegar con flechas, d para borrar, q para salir
```

---

## Checklist de mantenimiento mensual

- [ ] `docker builder prune -f` — build cache Docker
- [ ] `docker image prune -f` — imágenes colgantes
- [ ] `npm cache clean --force` — caché npm
- [ ] `npx npkill` en carpetas de proyectos viejos
- [ ] `brew cleanup -s && brew autoremove`
- [ ] `pip cache purge`
- [ ] Revisar `~/Library/Caches` (top 5 más grandes)
- [ ] `rm -rf ~/Library/Caches/com.openai.atlas` — ChatGPT cache si creció
- [ ] `df -h` para confirmar espacio disponible

---

## Valores de referencia (este Mac, mayo 2026)

- Docker build cache antes de limpiar: **~24 GB**
- Docker build cache después de `docker builder prune -f`: **~3.6 GB**
- Imágenes Docker activas: **~4.7 GB**
- Xcode DerivedData: **~25 GB** (seguro borrar, se regenera al compilar)
- npm cache (`~/.npm/_cacache`): **~14 GB** (`npm cache clean --force`)
- ChatGPT Desktop cache (`com.openai.atlas`): **~1.6 GB**
- iOS DeviceSupport: solo versiones iOS 26 activas — no borrar
- **Total liberado en 2 sesiones: ~57 GB**
