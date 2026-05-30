# 07 — Issues Conocidos

> **Última actualización:** 2026-05-30
> **Fuente de descubrimiento:** Cruce PDF programación Eli Daniel + audios WhatsApp 2026-05-29 y 2026-05-30

---

## ISSUE-01: Dirección de rotación de turnos invertida
**Severidad:** critical
**Estado:** resuelto — fix aplicado 2026-05-29

**Descripción:**
`getTurnoForWeek` calculaba la rotación en sentido ascendente (T1→T2→T3→T1) usando `(turnoInicioIndex + weeksElapsed) % 3`. El PDF de programación real de Eli Daniel confirma que la rotación es **descendente** (T3→T2→T1→T3): semana Apr 6 = T3, semana Apr 13 = T2, semana Apr 20 = T1. La fórmula ascendente no puede producir esa secuencia para ningún valor de `turnoInicioIndex`.

**Reproducción:**
```ts
// Con turnoInicioIndex=2 (T3) y ref=2026-04-06:
getTurnoForWeek(grupo, new Date("2026-04-13")) // devuelve "T1" — incorrecto, debe ser "T2"
```

**Fix aplicado:** Cambiar `+ weeksElapsed` → `- weeksElapsed` en `lib/roll-engine.ts`. Todos los tests actualizados para reflejar comportamiento correcto.

---

## ISSUE-02: Vista de Hoy no diferencia días libres dentro de la semana
**Severidad:** medium
**Estado:** resuelto — fix aplicado 2026-05-30

**Descripción:**
La Vista de Hoy (`/admin/hoy`) muestra a todos los colaboradores de un grupo bajo el turno de su semana, pero el roll real tiene **días libres específicos dentro de cada semana**:

| Turno de la semana | Días libres típicos |
|--------------------|---------------------|
| T3 | Viernes + Sábado |
| T2 | Sábado |
| T1 → T3 | **Ninguno** — el sábado entra de noche (22:00) |

Un colaborador que está en T2 esta semana tiene libre el sábado, pero la Vista de Hoy lo muestra como "en turno" ese día.

**Workaround:** El sistema de excepciones (`ExcepcionRoll`) puede usarse para marcar días libres manualmente.

**Fix aplicado:**
- `lib/roll-engine.ts` — función `getDiasLibres(turno): number[]` con patrón confirmado por imagen 2026-05-30: T3=[5,6], T2=[6], T1=[]
- `api/roll/hoy/route.ts` — colaboradores cuyo `diaHoy` está en `getDiasLibres(turno)` se mueven al array `libre` (separado de `turnos`)
- 5 tests nuevos agregados en `roll-engine.test.ts` → 22/22 passing

---

## ISSUE-04: Vista de Hoy muestra "T1/T2/T3" en vez de "Mañana/Tarde/Noche" con horarios
**Severidad:** medium (UX)
**Estado:** resuelto — fix aplicado 2026-05-29

**Descripción:**
La Vista de Hoy muestra los turnos como "T1", "T2", "T3" en el header de cada tarjeta. La imagen de programación real de Eli Daniel (2026-05-29) muestra las secciones como **Mañana**, **Tarde**, **Noche** con el horario correspondiente. El mapeo es fijo para todos los grupos:

| Código | Nombre | Horario |
|--------|--------|---------|
| T1 | Mañana | 06:00 – 14:00 |
| T2 | Tarde | 14:00 – 22:00 |
| T3 | Noche | 22:00 – 06:00 |

**Fix aplicado:** Actualizar `TURNO_CONFIG` en `admin/hoy/page.tsx` para mostrar el nombre del turno en el header de cada tarjeta.

---

## ISSUE-05: Colaboradores no tienen campo "puesto"
**Severidad:** high
**Estado:** resuelto — fix aplicado 2026-05-29

**Descripción:**
La imagen de programación muestra que cada colaborador tiene un puesto dentro de su turno: Charlie 1, Charlie 2, Charlie 3, Charlie 4, Charlie 5, Coordinador. El modelo `Colaborador` en Prisma no tiene campo `puesto`. Esto impide mostrar el puesto en Vista de Hoy, Asistencia y Roll.

**Fix aplicado:**
- `prisma/schema.prisma` — campo `puesto String? @db.NVarChar(50)` agregado
- `api/colaboradores/route.ts` y `[id]/route.ts` — campo `puesto` incluido en GET/POST/PUT
- `admin/colaboradores/page.tsx` — campo "Puesto" en formulario de crear/editar
- `api/roll/hoy/route.ts` — campo `puesto` en la respuesta
- `admin/hoy/page.tsx` — puesto visible junto al nombre del colaborador

---

## ISSUE-06: Vista de Hoy no tiene sección "Libre"
**Severidad:** medium
**Estado:** abierto — requiere ISSUE-02

**Descripción:**
La imagen de programación muestra una sección **Libre** al final del día con los colaboradores que tienen su día de descanso en el ciclo (Viernes 29: Matee D, HANZEL F, ALLAN W). Actualmente la Vista de Hoy solo muestra a los colaboradores en su turno asignado para la semana; no distingue si hoy es uno de sus días libres dentro del ciclo.

**Bloqueado por:** ISSUE-02 (modelar qué días de la semana son libres por turno). Una vez resuelto ISSUE-02, agregar la sección "Libre" es trivial: filtrar colaboradores cuyo turno sea el de esta semana pero cuyo día actual coincida con el día libre del patrón.

**Fix propuesto:** Diferido hasta resolver ISSUE-02.

---

## ISSUE-03: Días de transición de turno calculados incorrectamente (sábado/domingo)
**Severidad:** low
**Estado:** abierto — comportamiento conocido y aceptado

**Descripción:**
En ~2 días de cada ciclo de 21 días (el sábado/domingo de cambio de turno), el colaborador ya trabaja en el **turno siguiente** mientras el modelo semanal aún asigna el turno de la semana en curso. El error afecta solo esos 2 días por ciclo.

**Ejemplo:** Semana T1 (lunes-viernes T1). El sábado a las 22:00 empieza T3 — pero el modelo semanal sigue marcando T1 hasta el lunes siguiente.

**Workaround:** Excepción manual para el colaborador en esa semana. El hallazgo 2 (ISSUE-02) cuando se implemente también resolvería esto parcialmente.

**Fix propuesto:** Diferido — resolver junto con ISSUE-02.

---

## ISSUE-07: El modelo no soporta las 3 modalidades de colaborador
**Severidad:** high
**Estado:** abierto — pendiente implementación

**Descripción:**
Confirmado por Eli Daniel (audios 2026-05-30 + mensaje WhatsApp 2026-05-30 12:26):

> "Oficiales con turno mixto — Mañana, Tarde y Noche.
> Oficiales turno doble — Mañana, Tarde.
> Oficiales turnos fijos — Solo Mañana / Solo Tarde."

El modelo actual trata a **todos los colaboradores** como `FULL` (ciclo T3→T2→T1). Esto es incorrecto para:

- **Turno doble (`MT`):** participan del ciclo del grupo pero **nunca hacen Noche**. Cuando el grupo está en T3, ellos continúan en T2.
- **Fijos (`FIJO_T1` / `FIJO_T2`):** sin rotación. Siempre el mismo turno, 1 puesto fijo, no siguen el ciclo.

**Impacto:**
- Vista de Hoy (`/admin/hoy`): colaboradores MT aparecen en Noche cuando no deberían.
- Vista oficial: muestra turno incorrecto para MT y FIJO.
- Roll semanal: asigna turno incorrecto.

**Fix requerido:**
1. Agregar `modalidad String @default("FULL")` y `turnoFijo String?` a `Colaborador` en Prisma.
2. Actualizar `getDiasLibres()` y la lógica del API `/api/roll/hoy` para respetar la modalidad.
3. Actualizar UI de colaboradores para seleccionar modalidad.
4. Actualizar vista oficial para colaboradores FIJO.

**Ver:** TASK-ROLL-MODALIDAD (pendiente crear)
