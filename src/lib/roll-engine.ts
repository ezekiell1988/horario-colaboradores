/**
 * RollEngine — lógica pura de rotación de turnos.
 *
 * Turnos fijos:
 *   T1 = 06:00–14:00
 *   T2 = 14:00–22:00
 *   T3 = 22:00–06:00
 *
 * El ciclo avanza cada lunes: T1 → T2 → T3 → T1.
 * Cada grupo tiene su propio punto de inicio independiente.
 */

const TURNOS = ["T1", "T2", "T3"] as const;
export type Turno = (typeof TURNOS)[number];

export interface GrupoRotacion {
  turnoInicioIndex: number; // 0=T1, 1=T2, 2=T3
  fechaInicioRotacion: Date;
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Devuelve el lunes (00:00:00 UTC) de la semana a la que pertenece `date`.
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay(); // 0=Dom, 1=Lun … 6=Sáb
  const diff = day === 0 ? -6 : 1 - day; // ajuste hacia el lunes
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

/**
 * Calcula el turno que le corresponde a un grupo en la semana que contiene `fecha`.
 *
 * @param grupo  - Grupo con turnoInicioIndex y fechaInicioRotacion
 * @param fecha  - Cualquier fecha dentro de la semana objetivo
 * @returns      - "T1" | "T2" | "T3"
 */
export function getTurnoForWeek(grupo: GrupoRotacion, fecha: Date): Turno {
  const weekStart = getWeekStart(fecha);
  const refStart = getWeekStart(grupo.fechaInicioRotacion);
  const weeksElapsed = Math.round(
    (weekStart.getTime() - refStart.getTime()) / MS_PER_WEEK,
  );
  const index =
    ((grupo.turnoInicioIndex - weeksElapsed) % 3 + 3) % 3; // rotación descendente: T3→T2→T1→T3
  return TURNOS[index];
}

/**
 * Devuelve los días de la semana (UTC getDay: 0=Dom … 5=Vie, 6=Sáb) en que
 * un colaborador con el turno dado tiene día libre.
 *
 * Patrón confirmado:
 *   T3 (Noche → T2 la próxima): libre Viernes(5) + Sábado(6)
 *   T2 (Tarde → T1 la próxima): libre Sábado(6)
 *   T1 (Mañana → T3 la próxima): 0 libres (el sábado empieza T3 a las 22:00)
 */
export function getDiasLibres(turno: Turno): number[] {
  const diasPorTurno: Record<Turno, number[]> = {
    T3: [5, 6], // Viernes + Sábado
    T2: [6],    // Sábado
    T1: [],     // sin días libres (transición a T3)
  };
  return diasPorTurno[turno];
}
