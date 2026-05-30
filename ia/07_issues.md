# 07 — Issues Conocidos

> **Última actualización:** 2026-05-29
> **Fuente de descubrimiento:** Cruce PDF programación Eli Daniel + audios WhatsApp 2026-05-29

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
**Estado:** abierto — no implementado (requiere diseño)

**Descripción:**
La Vista de Hoy (`/admin/hoy`) muestra a todos los colaboradores de un grupo bajo el turno de su semana, pero el roll real tiene **días libres específicos dentro de cada semana**:

| Turno de la semana | Días libres típicos |
|--------------------|---------------------|
| T3 | Viernes + Sábado |
| T2 | Sábado |
| T1 → T3 | **Ninguno** — el sábado entra de noche (22:00) |

Un colaborador que está en T2 esta semana tiene libre el sábado, pero la Vista de Hoy lo muestra como "en turno" ese día.

**Workaround:** El sistema de excepciones (`ExcepcionRoll`) puede usarse para marcar días libres manualmente.

**Fix propuesto:** Agregar función `getDiaLibreEnSemana(turnoActual, turnoSiguiente): number[]` que devuelva los días de la semana (0–6) donde el colaborador está libre, y usarla en el API `/api/roll/hoy` para filtrar si `hoy` es uno de esos días.

---

## ISSUE-03: Días de transición de turno calculados incorrectamente (sábado/domingo)
**Severidad:** low
**Estado:** abierto — comportamiento conocido y aceptado

**Descripción:**
En ~2 días de cada ciclo de 21 días (el sábado/domingo de cambio de turno), el colaborador ya trabaja en el **turno siguiente** mientras el modelo semanal aún asigna el turno de la semana en curso. El error afecta solo esos 2 días por ciclo.

**Ejemplo:** Semana T1 (lunes-viernes T1). El sábado a las 22:00 empieza T3 — pero el modelo semanal sigue marcando T1 hasta el lunes siguiente.

**Workaround:** Excepción manual para el colaborador en esa semana. El hallazgo 2 (ISSUE-02) cuando se implemente también resolvería esto parcialmente.

**Fix propuesto:** Diferido — resolver junto con ISSUE-02.
