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

/** Offset fijo de Costa Rica: UTC-6, sin horario de verano. */
const CR_OFFSET_MS = -6 * 60 * 60 * 1000;

/**
 * Retorna la fecha/hora actual ajustada a la zona horaria de Costa Rica (GMT-6).
 * Los métodos getUTC*() del objeto retornado reflejan la hora local de CR,
 * lo que permite usar las funciones de cálculo UTC-based sin ambigüedad de día.
 */
export function nowCR(): Date {
  return new Date(Date.now() + CR_OFFSET_MS);
}

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

export type Modalidad = "FULL" | "MT" | "FIJO" | "MT_ALTERNO";

/**
 * Calcula el turno efectivo de un colaborador dado su modalidad, turnoFijo y
 * el turno del grupo en la semana actual.
 *
 * - FULL:       usa el turno del grupo sin cambios.
 * - MT:         si el grupo está en T3 (Noche), el colaborador permanece en T2 (Tarde).
 * - FIJO:       siempre el turno indicado en `turnoFijo`, sin importar el ciclo.
 * - MT_ALTERNO: usar `getTurnoPorDia()` en su lugar — esta función no aplica.
 */
export function getTurnoEfectivo(
  modalidad: Modalidad,
  turnoFijo: string | null,
  turnoSemana: Turno,
): Turno {
  if (modalidad === "FIJO" && turnoFijo) {
    // T_ADMIN = horario administrativo, se trata como T1 para la rotación visual
    if (turnoFijo === "T_ADMIN") return "T1";
    return turnoFijo as Turno;
  }
  if (modalidad === "MT" && turnoSemana === "T3") return "T2";
  return turnoSemana;
}

export type TurnoDia = Turno | "LIBRE";

/**
 * Calcula el turno efectivo de un colaborador `MT_ALTERNO` para un día concreto.
 *
 * Patrón (confirmado con imagen calendario Junio 2026):
 *   Miércoles (3) → siempre LIBRE
 *   Semana A (semanasDesdeInicio par):
 *     Lun(1), Mar(2), Sáb(6), Dom(0) → T2
 *     Jue(4), Vie(5)                 → T1
 *   Semana B (semanasDesdeInicio impar):
 *     Lun(1), Mar(2), Sáb(6), Dom(0) → T1
 *     Jue(4), Vie(5)                 → T2
 *
 * @param fechaInicioPersonal - Lunes de referencia donde comienza la Semana A del colaborador.
 * @param fecha               - Fecha concreta a evaluar.
 * @returns TurnoDia          - "T1" | "T2" | "LIBRE"
 */
export function getTurnoPorDia(
  fechaInicioPersonal: Date,
  fecha: Date,
): TurnoDia {
  const weekStart = getWeekStart(fecha);
  const refStart = getWeekStart(fechaInicioPersonal);
  const semanasDesdeInicio = Math.round(
    (weekStart.getTime() - refStart.getTime()) / MS_PER_WEEK,
  );
  const diaSemana = fecha.getUTCDay(); // 0=Dom, 1=Lun … 6=Sáb

  if (diaSemana === 3) return "LIBRE"; // miércoles siempre libre

  const esSemanaPar = ((semanasDesdeInicio % 2) + 2) % 2 === 0; // Semana A

  // Días con patrón invertido entre semanas
  const esDiaAlternado = diaSemana === 4 || diaSemana === 5; // Jue o Vie

  if (esSemanaPar) {
    return esDiaAlternado ? "T1" : "T2";
  } else {
    return esDiaAlternado ? "T2" : "T1";
  }
}

/**
 * Devuelve los días de la semana (UTC getDay: 0=Dom … 5=Vie, 6=Sáb) en que
 * un colaborador con el turno dado tiene día libre.
 *
 * Los días libres son INDIVIDUALES (configurados en diaLibre/diaLibreExtra).
 * El único patrón fijo es MT_ALTERNO: siempre libre el Miércoles(3).
 * Para T1/T2/T3 retorna [] — los libres se configuran por persona, no por turno.
 */
export function getDiasLibres(turno: Turno | "MT_ALTERNO"): number[] {
  if (turno === "MT_ALTERNO") return [3]; // Miércoles — patrón fijo MT_ALTERNO
  return []; // Sin libres por defecto; configurar diaLibre/diaLibreExtra individualmente
}

const DIA_SEMANA_MAP: Record<string, number> = {
  DOMINGO: 0,
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
};

/**
 * Devuelve los días de la semana libre de un colaborador basándose en sus
 * campos diaLibre y diaLibreExtra almacenados en BD.
 * Si no hay días configurados, retorna null para indicar que se debe usar
 * el patrón por defecto del turno (getDiasLibres).
 */
export function getDiasLibresColaborador(
  diaLibre: string | null,
  diaLibreExtra: string | null,
): number[] | null {
  const dias: number[] = [];
  if (diaLibre && DIA_SEMANA_MAP[diaLibre] !== undefined) {
    dias.push(DIA_SEMANA_MAP[diaLibre]);
  }
  if (diaLibreExtra && DIA_SEMANA_MAP[diaLibreExtra] !== undefined) {
    dias.push(DIA_SEMANA_MAP[diaLibreExtra]);
  }
  return dias.length > 0 ? dias : null;
}
