# 01 — Requisitos del Sistema

> **Última actualización:** 2026-05-30
> **Fuentes:** `ia/assets/nota.txt`, sesión de levantamiento 2026-05-29, audios WhatsApp Eli Daniel 2026-05-29 y 2026-05-30, audio8 + imagen calendario Junio 2026 (2026-05-30), mensaje WhatsApp Eli Daniel 2026-05-30 (días libres configurables + alta individual)

## Propósito del sistema
Roll Manager gestiona el roll automático de turnos rotativos semanales de colaboradores de seguridad, registra su asistencia diaria y permite generar, editar con IA y exportar informes formales en PDF.

## Reglas fundamentales de negocio
- Los 3 turnos son **fijos e inmutables**: 06:00–14:00, 14:00–22:00, 22:00–06:00.
- La rotación avanza **cada lunes**: T1 → T2 → T3 → T1 (ciclo de 3 semanas).
- Cada **grupo** rota de forma independiente; dos grupos pueden estar en puntos distintos del ciclo.
- Un colaborador pertenece a **un solo grupo** a la vez.
- El sistema nunca debe dejar un turno activo sin al menos un colaborador asignado.
- Solo el **administrador** puede crear/modificar colaboradores, grupos, asistencia e informes.
- Los **oficiales** solo pueden consultar su turno actual y próximo.

## Modalidades de colaborador (confirmado Eli Daniel 2026-05-30)

Existen 3 tipos de colaborador según su patrón de rotación:

| Modalidad | Nombre oficial | Turnos que rota | Ciclo | Días libres (referencia) |
|-----------|---------------|-----------------|-------|--------------------------|
| `FULL` | Turno mixto | Mañana + Tarde + Noche | 21 días (3 semanas) | T3=Vie+Sáb, T2=Sáb, T1=ninguno |
| `MT` | Turno doble | Solo Mañana + Tarde | 14 días (2 semanas) | T2=Sáb, T1=ninguno |
| `FIJO_T1` | Fijo mañana | Solo Mañana (06:00–14:00) | Sin ciclo | ninguno |
| `FIJO_T2` | Fijo tarde | Solo Tarde (14:00–22:00) | Sin ciclo | ninguno |
| `MT_ALTERNO` | Alterno M/T | Mañana + Tarde, bloques de 2 días | 2 semanas (propio) | **Miércoles fijo** |

> **Confirmado Eli Daniel 2026-05-30:** Los días libres **no son fijos por modalidad**. El coordinador debe poder **elegir el día libre** de cada colaborador al crearlo o editarlo. Los valores de la tabla anterior son solo orientativos. Los campos `diaLibre` y `diaLibreExtra` en la BD son la fuente de verdad. `MT_ALTERNO` es la única excepción donde el miércoles es estructuralmente libre por el patrón de alternancia, aunque el admin puede configurar un día libre adicional.

**Reglas de negocio por modalidad:**
- `FULL` y `MT` usan la misma `fechaInicioRotacion` del grupo — el cálculo es idéntico, solo cambia qué turnos participan.
- `MT`: cuando el ciclo del grupo cae en T3 (Noche), el colaborador MT simplemente continúa en T2 (Tarde) — **no trabaja de noche**.
- `FIJO_T1` / `FIJO_T2`: no participan del ciclo; siempre ocupan el mismo turno. Solo necesitan 1 puesto en la Vista de Hoy.
- Los días libres de **todos los colaboradores** (incluso fijos) se configuran manualmente al crear/editar el colaborador — no se derivan automáticamente de la modalidad.
- `MT_ALTERNO`: ver sección completa a continuación.

---

## Modalidad MT_ALTERNO — Especificación detallada
> **Origen:** audio8 (2026-05-30) + imagen calendario Junio 2026 facilitada por Eli Daniel.

### Descripción
Colaborador que trabaja únicamente Mañana (T1) y Tarde (T2) **nunca Noche (T3)**, tiene siempre el **miércoles libre**, y alterna turnos en bloques de 2 días con un ciclo personal de **2 semanas independiente del grupo**.

### Patrón semanal confirmado (imagen Junio 2026)

| Semana | Lun | Mar | Mié | Jue | Vie | Sáb | Dom |
|--------|-----|-----|-----|-----|-----|-----|-----|
| **A** (impar del ciclo) | T | T | **Libre** | M | M | T | T |
| **B** (par del ciclo)   | M | M | **Libre** | T | T | M | M |

El ciclo se repite cada 2 semanas (Semana A → Semana B → Semana A → …).

### Reglas
1. **Miércoles = siempre libre**, sin excepción, independiente del ciclo.
2. **No trabaja T3 (noche)** en ningún caso.
3. Su ciclo es **independiente del grupo** — usa `fechaInicioPersonal` propia (lunes de referencia donde empezó Semana A o B).
4. `turnoFijo` se reutiliza para indicar el turno del **lunes de la semana de referencia** (`T1` = la semana de referencia es Semana B, `T2` = es Semana A). Véase fórmula abajo.
5. El colaborador sigue perteneciendo a un grupo (para efectos de administración), pero su rotación no depende del ciclo del grupo.

### Fórmula de cálculo del turno efectivo por día

```
semanasDesdeInicio = floor((inicioSemanaActual - fechaInicioPersonal) / 7 días)
esSemanaPar = semanasDesdeInicio % 2 === 0

si esSemanaPar (Semana A):
  Lun → T2, Mar → T2, Mié → Libre, Jue → T1, Vie → T1, Sáb → T2, Dom → T2

si esSemanasImpar (Semana B):
  Lun → T1, Mar → T1, Mié → Libre, Jue → T2, Vie → T2, Sáb → T1, Dom → T1
```

> Nota: la paridad (A/B) se determina según la `fechaInicioPersonal` del colaborador. Debe ser un lunes en que el colaborador estaba en Semana A.

### Cambios requeridos en la base de datos

| Campo | Tabla | Tipo | Propósito |
|-------|-------|------|-----------|
| `fechaInicioPersonal` | `Colaborador` | `DateTime?` | Lunes de referencia del ciclo propio (solo `MT_ALTERNO`) || `diaLibre` | `Colaborador` | `DiaSemana?` | Día libre principal elegido por el coordinador (aplica a todos) |
| `diaLibreExtra` | `Colaborador` | `DiaSemana?` | Segundo día libre opcional (ej. FULL en T3 que libra Vie+Sáb) |

Donde `DiaSemana` es enum: `LUNES | MARTES | MIERCOLES | JUEVES | VIERNES | SABADO | DOMINGO`.
La nueva modalidad se agrega al enum `Modalidad` en `roll-engine.ts`: `"FULL" | "MT" | "FIJO" | "MT_ALTERNO"`.

### Impacto en vistas existentes
- **Vista del Roll (`/admin/roll`):** calcular turno por día (no por semana) para este colaborador, marcar Mié como "Libre".
- **Vista Hoy (`/admin`):** mostrar en T1 o T2 según el día actual; no aparece en T3; si es miércoles, mostrar como "Libre".
- **Vista Asistencia:** si es miércoles, el colaborador `MT_ALTERNO` no debe generar registro de asistencia (día libre fijo).
- **Vista Oficial:** el oficial con esta modalidad ve su turno día por día (no el turno de la semana completa).

## Flujos principales

### Flujo 0 — Alta de Colaborador (uno a uno)
> **Confirmado Eli Daniel 2026-05-30:** el proceso de incorporación es individual; no se admite carga masiva.

**Estado de entrada:** Admin autenticado, grupos existentes.
**Estado de salida:** Colaborador creado y asignado a un grupo.

1. El admin abre `/admin/colaboradores/nuevo`.
2. Completa el formulario con:
   - Nombre completo
   - Modalidad (`FULL` / `MT` / `FIJO_T1` / `FIJO_T2` / `MT_ALTERNO`)
   - Grupo al que pertenece
   - **Día libre principal** (selector: Lunes … Domingo / Sin día libre) ← obligatorio
   - **Día libre extra** — opcional, para casos con 2 días libres (ej. FULL en T3)
   - `fechaInicioPersonal` — visible y obligatorio solo si modalidad es `MT_ALTERNO`
3. El sistema valida y crea el registro.
4. El colaborador queda activo de inmediato y aparece en la Vista de Hoy.

**Reglas:**
- No hay importación CSV ni alta masiva — cada colaborador se agrega individualmente.
- El campo "Día libre" es obligatorio; el coordinador elige "Sin día libre" si corresponde.
- El sistema muestra los 7 días de la semana como opciones; no los deriva de la modalidad.
- La misma selección de días libres aplica al editar un colaborador existente.

---

### Flujo 1 — Generación del Roll Semanal
**Estado de entrada:** Colaboradores y grupos configurados; semana objetivo definida.
**Estado de salida:** Roll generado, visible para el grupo.

1. El admin selecciona el grupo y la semana.
2. El sistema calcula el turno correspondiente según el ciclo y la fecha de inicio del grupo.
3. Se muestra el roll: qué turno le corresponde a cada colaborador cada día de la semana.
4. El admin puede marcar excepciones por colaborador (vacaciones, permiso, ausencia).

### Flujo 2 — Registro de Asistencia Diaria
**Estado de entrada:** Roll del día generado.
**Estado de salida:** Recuadro de asistencia del día completo.

1. El admin abre la vista de asistencia del día actual.
2. Por cada colaborador en turno se muestra:
   - Nombre
   - Turno asignado
   - Puesto / lugar asignado
   - Estado: `presente` / `ausente` / `permiso`
3. El admin actualiza el estado de cada colaborador.
4. El recuadro queda disponible para generar el informe del día.

### Flujo 3 — Generación de Informe Diario con IA
**Estado de entrada:** Borrador de texto escrito por el admin.
**Estado de salida:** PDF formalizado listo para compartir.

1. El admin abre el módulo de informes y escribe el borrador (novedades, eventos, asistencia).
2. Presiona **"Formalizar con IA"** → Azure AI reescribe el texto en tono formal institucional.
3. El admin revisa y edita el resultado libremente.
4. Presiona **"Exportar PDF"** → se descarga el archivo.
5. El admin abre WhatsApp manualmente y comparte el PDF.

## Campos del recuadro de asistencia
| Campo | Tipo |
|-------|------|
| Nombre del oficial | Texto |
| Turno asignado | Enum (T1 / T2 / T3) |
| Puesto / lugar asignado | Texto |
| Estado | Enum (presente / ausente / permiso) |

---

## Flujo 4 — Vista "Hoy" (Dashboard Diario) ⬅ nuevo
> **Origen:** Audios WhatsApp de Eli Daniel (2026-05-29). Requisito central del sistema.

**Estado de entrada:** Al menos un grupo configurado con fechaInicioRotacion.
**Estado de salida:** Pantalla única que muestra, para el día actual, qué colaboradores de **todos los grupos** están en cada turno.

**Descripción:**
El usuario abre la app y ve de inmediato — sin seleccionar nada — una tabla o tarjetas organizadas por turno:

| T1 · 06:00–14:00 | T2 · 14:00–22:00 | T3 · 22:00–06:00 |
|------------------|------------------|------------------|
| Juan, María…     | Rosa, Pedro…     | Ana, Luis…       |

El sistema calcula el turno de cada grupo para la semana de la fecha actual y lista a todos los colaboradores activos (sin excepción ese día) bajo el turno correspondiente.

**Reglas:**
- La fecha de referencia es **hoy** (fecha del servidor, UTC-6 Costa Rica).
- Colaboradores con excepción activa (`vacaciones` / `permiso` / `ausencia`) para esa semana aparecen en su turno pero marcados visualmente como "fuera".
- No se requiere selección de grupo ni semana — la vista es 100% automática.
- Accesible desde el menú principal del admin como primera pantalla tras el login.
- El oficial ve la misma vista pero solo ve su propio nombre (no todos los grupos).

**Pasos del flujo:**
1. Al entrar al panel admin, la ruta `/admin` carga la vista "Hoy".
2. El sistema obtiene todos los grupos activos con sus colaboradores activos.
3. Para cada grupo, calcula el turno de la semana actual con `getTurnoForWeek()`.
4. Agrupa a todos los colaboradores por turno (T1 / T2 / T3).
5. Consulta excepciones de esa semana para resaltarlas.
6. Muestra las tarjetas de turno con los nombres. Sin paginación, sin filtros.
