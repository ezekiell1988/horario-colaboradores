# Cómo generar el reporte HTML final del skill `my-mac`

El reporte HTML es el **output obligatorio al finalizar cada corrida** del skill. Resume de forma amigable (sin tecnicismos) qué había, qué se hizo y cómo quedó el Mac.

---

## Nombre del archivo

Formato: `YYYYMMDDHHMI.html`  
Ejemplo: `202605301054.html` → 30 de mayo de 2026, 10:54 hrs.

Guardar siempre en: `.agents/skills/my-mac/reports/`

---

## Cuándo generarlo

Al **terminar** cada sesión de optimización, sin importar si se limpiaron una o varias carpetas.

---

## Datos a recopilar ANTES de comenzar

Correr estos comandos al inicio de cada sesión y guardar los valores:

```bash
# Espacio libre
df -h / | tail -1 | awk '{print $4}'

# DerivedData Xcode
du -sh ~/Library/Developer/Xcode/DerivedData 2>/dev/null || echo "0 B"

# npm cache
du -sh ~/.npm/_cacache 2>/dev/null || echo "0 B"

# Docker build cache
docker system df 2>/dev/null | grep "Build Cache" | awk '{print $4}'

# ChatGPT Desktop
du -sh ~/Library/Caches/com.openai.atlas 2>/dev/null || echo "0 B"

# JetBrains
du -sh ~/Library/Caches/JetBrains 2>/dev/null || echo "0 B"

# Homebrew
du -sh ~/Library/Caches/Homebrew 2>/dev/null || echo "0 B"

# pip
du -sh ~/Library/Caches/pip 2>/dev/null || echo "0 B"
```

---

## Datos a recopilar DESPUÉS de terminar

Repetir los mismos comandos y registrar los valores finales.  
Calcular: `liberado = antes - después`.

---

## Estructura del reporte HTML

El reporte tiene exactamente **3 secciones principales** y un **bloque de métricas destacadas** al inicio:

### 1. Métricas destacadas (hero cards)
Cuatro tarjetas al inicio que muestran los números más importantes:
- **Total liberado** (en GB)
- **Espacio disponible ahora** (en GB)
- **Espacio que había antes** (en GB)
- **Número de limpiezas realizadas**

### 2. Sección ANTES y DESPUÉS
- Dos barras de progreso visuales mostrando el porcentaje de uso del disco antes y después.
- Tabla comparativa lado a lado con los tamaños de cada carpeta.

### 3. Sección "¿Qué se limpió?"
Una tarjeta por cada ítem limpiado con:
- Nombre amigable (no nombre técnico de carpeta)
- Explicación en español simple de **para qué sirve** esa carpeta
- Por qué es seguro borrarla
- Cuánto espacio se liberó

**Tono**: explicar como si el lector no supiera nada de programación.  
❌ No usar: `DerivedData`, `_cacache`, rutas de carpetas  
✅ Usar: "compilaciones guardadas de Xcode", "caché de paquetes de programación"

### 4. Sección "¿Qué se revisó pero no se tocó?"
Lista de carpetas analizadas que se decidió no borrar y por qué.

### 5. Sección "¿Qué hacer en el próximo mantenimiento?"
Lista numerada de acciones pendientes para la siguiente sesión.

---

## Plantilla base

Copiar el archivo `reports/202605301054.html` como punto de partida para futuras sesiones.  
Modificar:
- Fecha en el `<title>` y en el header
- Los valores en las hero cards
- Los ítems de las secciones según lo que realmente se haya limpiado
- La barra de disco: ajustar el `width` de `.fill.before` y `.fill.after` según los porcentajes reales

---

## Valores de referencia (este Mac — mayo 2026)

| Carpeta | Qué es | Tamaño típico | Seguro borrar |
|---------|--------|--------------|---------------|
| `~/Library/Developer/Xcode/DerivedData` | Compilaciones Xcode | 10-30 GB | ✅ Sí |
| `~/.npm/_cacache` | Caché npm | 5-20 GB | ✅ Sí |
| `~/Library/Caches/com.openai.atlas` | Caché ChatGPT Desktop | 1-3 GB | ✅ Sí |
| Docker build cache | Pasos intermedios de builds | 5-25 GB | ✅ Con `docker builder prune` |
| `~/Library/Caches/JetBrains` | IDEs JetBrains | 2-5 GB | ✅ Si no están activos |
| `~/Library/Caches/Homebrew` | Versiones viejas brew | 500 MB-2 GB | ✅ Con `brew cleanup` |
| `~/Library/Caches/pip` | Paquetes Python | 500 MB-2 GB | ✅ Si no hay dev Python activo |
| `~/Library/Developer/CoreSimulator` | Simuladores iOS | 3-10 GB | ⚠️ Solo versiones viejas |
| `~/Library/Developer/Xcode/iOS DeviceSupport` | Soporte dispositivos físicos | 10-25 GB | ⚠️ Solo versiones ya no soportadas |
