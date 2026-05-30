# ncdu — NCurses Disk Usage

## Qué es

`ncdu` (NCurses Disk Usage) es un explorador de disco interactivo para terminal. 
Gratuito, open source (MIT), disponible en Homebrew. Alternativa visual y navegable a `du`.

## Instalación

```bash
brew install ncdu
```

Verificar versión:
```bash
ncdu --version
```

---

## Uso básico

```bash
ncdu ~          # escanear y explorar el home (~)
ncdu /          # escanear todo el sistema (puede tardar ~10 seg)
ncdu .          # escanear directorio actual
ncdu ~/Documents
```

---

## Navegación (atajos de teclado)

| Tecla | Acción |
|-------|--------|
| ↑ / ↓ | Moverse entre ítems |
| → / Enter | Entrar a carpeta |
| ← / Backspace | Subir un nivel |
| `d` | **Borrar** el ítem seleccionado (pide confirmación) |
| `r` | Re-escanear directorio actual |
| `q` | Salir |
| `n` | Ordenar por nombre |
| `s` | Ordenar por tamaño (default) |
| `C` | Ordenar por número de archivos |
| `i` | Info del ítem seleccionado |
| `g` | Mostrar porcentaje / barra gráfica (cicla entre modos) |
| `e` | Ocultar/mostrar archivos ocultos (`.`) |
| `x` | Excluir otros sistemas de archivos (útil en `/`) |

---

## Casos de uso habituales en este proyecto

### Ver qué carpeta del home ocupa más
```bash
ncdu ~
```
Ordenado por tamaño por defecto. Entrar con → para explorar subcarpetas.

### Encontrar node_modules grandes
```bash
ncdu ~/Documents
# navegar hasta el proyecto, entrar a node_modules
```

### Revisar Docker (datos en ~/Library/Containers)
```bash
ncdu ~/Library/Containers/com.docker.docker
```

### Revisar caches del sistema
```bash
ncdu ~/Library/Caches
```

### Escanear solo disco principal (sin montar otros volúmenes)
```bash
ncdu -x /
```

---

## Consejos

- Para borrar desde ncdu: navegar al ítem → `d` → confirmar con `y`. Es seguro, pide confirmación.
- No borrar carpetas del sistema (`/System`, `/usr`, `/private/var/db`).
- En carpetas grandes como `/` el escaneo inicial tarda ~5-15 segundos; esperar sin cancelar.
- `ncdu -x ~` excluye carpetas montadas (Time Machine, NFS, etc.) para un escaneo más rápido.

---

## Comparación con alternativas

| Herramienta | Interactivo | Visual | Instalación |
|-------------|-------------|--------|-------------|
| `ncdu` | ✅ Terminal | Barras ASCII | `brew install ncdu` |
| `du -sh` | ❌ | ❌ | Nativo macOS |
| `dust` | ❌ | Colores | `brew install dust` |
| Finder → Almacenamiento | ✅ GUI | ✅ | Nativo macOS |

**Recomendación:** `ncdu` para encontrar qué borrar; Finder → Almacenamiento para una vista rápida general.
