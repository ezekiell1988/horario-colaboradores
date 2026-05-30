import { getTurnoForWeek, getWeekStart, GrupoRotacion } from "../roll-engine";

// Grupo de referencia: inicia en T1 el lunes 2026-01-05
const grupoT1: GrupoRotacion = {
  turnoInicioIndex: 0,
  fechaInicioRotacion: new Date("2026-01-05T00:00:00Z"),
};

// Grupo de referencia: inicia en T2 el lunes 2026-01-05
const grupoT2: GrupoRotacion = {
  turnoInicioIndex: 1,
  fechaInicioRotacion: new Date("2026-01-05T00:00:00Z"),
};

// Grupo basado en programación real de Eli Daniel (PDF 2026-04-07)
// Semana 2026-04-06 = T3, 2026-04-13 = T2, 2026-04-20 = T1, 2026-04-27 = T3
const grupoEli: GrupoRotacion = {
  turnoInicioIndex: 2, // inicia T3
  fechaInicioRotacion: new Date("2026-04-06T00:00:00Z"),
};

describe("getWeekStart", () => {
  it("devuelve el lunes de la misma semana para un miércoles", () => {
    const result = getWeekStart(new Date("2026-01-07T12:00:00Z")); // miércoles
    expect(result.toISOString()).toBe("2026-01-05T00:00:00.000Z"); // lunes previo
  });

  it("devuelve el mismo lunes cuando la fecha ya es lunes", () => {
    const result = getWeekStart(new Date("2026-01-05T08:00:00Z"));
    expect(result.toISOString()).toBe("2026-01-05T00:00:00.000Z");
  });

  it("para un domingo devuelve el lunes anterior (no el siguiente)", () => {
    const result = getWeekStart(new Date("2026-01-11T00:00:00Z")); // domingo
    expect(result.toISOString()).toBe("2026-01-05T00:00:00.000Z");
  });
});

describe("getTurnoForWeek", () => {
  it("semana 0 → turno de inicio (T1)", () => {
    expect(getTurnoForWeek(grupoT1, new Date("2026-01-05T00:00:00Z"))).toBe("T1");
  });

  it("semana +1 → T3 (rotación descendente T1→T3)", () => {
    expect(getTurnoForWeek(grupoT1, new Date("2026-01-12T00:00:00Z"))).toBe("T3");
  });

  it("semana +2 → T2", () => {
    expect(getTurnoForWeek(grupoT1, new Date("2026-01-19T00:00:00Z"))).toBe("T2");
  });

  it("semana +3 → vuelve a T1 (ciclo completo)", () => {
    expect(getTurnoForWeek(grupoT1, new Date("2026-01-26T00:00:00Z"))).toBe("T1");
  });

  it("grupo que inicia en T2: semana 0 → T2, semana +1 → T1 (rotación descendente)", () => {
    expect(getTurnoForWeek(grupoT2, new Date("2026-01-05T00:00:00Z"))).toBe("T2");
    expect(getTurnoForWeek(grupoT2, new Date("2026-01-12T00:00:00Z"))).toBe("T1");
  });

  it("funciona con fechas pasadas (semanas negativas): semana -1 → T2", () => {
    // Con rotación descendente, antes de T1 viene T2
    expect(getTurnoForWeek(grupoT1, new Date("2025-12-29T00:00:00Z"))).toBe("T2");
  });

  it("cruce de año nuevo: semanas consecutivas avanzan en sentido descendente", () => {
    const t0 = getTurnoForWeek(grupoT1, new Date("2025-12-29T00:00:00Z"));
    const t1 = getTurnoForWeek(grupoT1, new Date("2026-01-05T00:00:00Z"));
    const turnos = ["T1", "T2", "T3"];
    const idx0 = turnos.indexOf(t0);
    const idx1 = turnos.indexOf(t1);
    // Rotación descendente: la semana siguiente retrocede 1 en el índice
    expect((idx0 - 1 + 3) % 3).toBe(idx1);
  });

  it("mid-week: cualquier día de la semana retorna el mismo turno que el lunes", () => {
    const lunes = getTurnoForWeek(grupoT1, new Date("2026-01-12T00:00:00Z"));
    const jueves = getTurnoForWeek(grupoT1, new Date("2026-01-15T14:30:00Z"));
    expect(lunes).toBe(jueves);
  });
});

describe("getTurnoForWeek — validación contra programación real (PDF Eli Daniel)", () => {
  it("semana 2026-04-06 → T3", () => {
    expect(getTurnoForWeek(grupoEli, new Date("2026-04-06T00:00:00Z"))).toBe("T3");
  });

  it("semana 2026-04-13 → T2", () => {
    expect(getTurnoForWeek(grupoEli, new Date("2026-04-13T00:00:00Z"))).toBe("T2");
  });

  it("semana 2026-04-20 → T1", () => {
    expect(getTurnoForWeek(grupoEli, new Date("2026-04-20T00:00:00Z"))).toBe("T1");
  });

  it("semana 2026-04-27 → T3 (ciclo completo)", () => {
    expect(getTurnoForWeek(grupoEli, new Date("2026-04-27T00:00:00Z"))).toBe("T3");
  });

  it("semana 2026-05-04 → T2", () => {
    expect(getTurnoForWeek(grupoEli, new Date("2026-05-04T00:00:00Z"))).toBe("T2");
  });

  it("semana 2026-05-11 → T1", () => {
    expect(getTurnoForWeek(grupoEli, new Date("2026-05-11T00:00:00Z"))).toBe("T1");
  });
});
