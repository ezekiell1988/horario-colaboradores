import { getTurnoForWeek, getDiasLibres, getWeekStart, getTurnoEfectivo, getTurnoPorDia, GrupoRotacion, TurnoDia } from "../roll-engine";

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

describe("getDiasLibres", () => {
  it("T1, T2 y T3 retornan [] — días libres son individuales por persona", () => {
    expect(getDiasLibres("T1")).toEqual([]);
    expect(getDiasLibres("T2")).toEqual([]);
    expect(getDiasLibres("T3")).toEqual([]);
  });

  it("ningún turno tiene sábado(6) como libre por defecto", () => {
    expect(getDiasLibres("T1").includes(6)).toBe(false);
    expect(getDiasLibres("T2").includes(6)).toBe(false);
    expect(getDiasLibres("T3").includes(6)).toBe(false);
  });

  it("ningún turno tiene viernes(5) como libre por defecto", () => {
    expect(getDiasLibres("T1").includes(5)).toBe(false);
    expect(getDiasLibres("T2").includes(5)).toBe(false);
    expect(getDiasLibres("T3").includes(5)).toBe(false);
  });
});

describe("getTurnoEfectivo — modalidad FULL", () => {
  it("FULL en semana T1 → T1", () => {
    expect(getTurnoEfectivo("FULL", null, "T1")).toBe("T1");
  });

  it("FULL en semana T3 → T3 (sí hace noche)", () => {
    expect(getTurnoEfectivo("FULL", null, "T3")).toBe("T3");
  });
});

describe("getTurnoEfectivo — modalidad MT (turno doble)", () => {
  it("MT en semana T1 → T1", () => {
    expect(getTurnoEfectivo("MT", null, "T1")).toBe("T1");
  });

  it("MT en semana T2 → T2", () => {
    expect(getTurnoEfectivo("MT", null, "T2")).toBe("T2");
  });

  it("MT en semana T3 → T2 (no trabaja de noche)", () => {
    expect(getTurnoEfectivo("MT", null, "T3")).toBe("T2");
  });

  it("MT nunca retorna T3 independientemente del turno de semana", () => {
    const resultado = getTurnoEfectivo("MT", null, "T3");
    expect(resultado).not.toBe("T3");
  });
});

describe("getTurnoEfectivo — modalidad FIJO", () => {
  it("FIJO T1 en semana T1 → T1", () => {
    expect(getTurnoEfectivo("FIJO", "T1", "T1")).toBe("T1");
  });

  it("FIJO T1 en semana T2 → T1 (ignora ciclo del grupo)", () => {
    expect(getTurnoEfectivo("FIJO", "T1", "T2")).toBe("T1");
  });

  it("FIJO T1 en semana T3 → T1 (nunca hace noche)", () => {
    expect(getTurnoEfectivo("FIJO", "T1", "T3")).toBe("T1");
  });

  it("FIJO T2 en semana T1 → T2", () => {
    expect(getTurnoEfectivo("FIJO", "T2", "T1")).toBe("T2");
  });

  it("FIJO T2 en semana T3 → T2", () => {
    expect(getTurnoEfectivo("FIJO", "T2", "T3")).toBe("T2");
  });
});

// -------------------------------------------------------------------
// MT_ALTERNO — ciclo propio de 2 semanas, miércoles siempre libre
// Referencia: imagen calendario Junio 2026
// fechaInicioPersonal: lunes 2026-06-01 = inicio Semana A
//
// Junio 2026:  Lun=1, Mar=2, Mié=3, Jue=4, Vie=5, Sáb=6, Dom=7
//              Lun=8(Sem B), Mar=9, Mié=10, Jue=11, Vie=12, Sáb=13, Dom=14
// -------------------------------------------------------------------
describe("getTurnoPorDia — modalidad MT_ALTERNO", () => {
  // Semana A inicia el 2026-06-01 (lunes)
  const refSemanA = new Date("2026-06-01T00:00:00Z");

  it("Semana A — Lunes (Jun 1) → T2", () => {
    expect(getTurnoPorDia(refSemanA, new Date("2026-06-01T00:00:00Z"))).toBe("T2");
  });

  it("Semana A — Martes (Jun 2) → T2", () => {
    expect(getTurnoPorDia(refSemanA, new Date("2026-06-02T00:00:00Z"))).toBe("T2");
  });

  it("Semana A — Miércoles (Jun 3) → LIBRE", () => {
    expect(getTurnoPorDia(refSemanA, new Date("2026-06-03T00:00:00Z"))).toBe("LIBRE");
  });

  it("Semana A — Jueves (Jun 4) → T1", () => {
    expect(getTurnoPorDia(refSemanA, new Date("2026-06-04T00:00:00Z"))).toBe("T1");
  });

  it("Semana A — Viernes (Jun 5) → T1", () => {
    expect(getTurnoPorDia(refSemanA, new Date("2026-06-05T00:00:00Z"))).toBe("T1");
  });

  it("Semana A — Sábado (Jun 6) → T2", () => {
    expect(getTurnoPorDia(refSemanA, new Date("2026-06-06T00:00:00Z"))).toBe("T2");
  });

  it("Semana A — Domingo (Jun 7) → T2", () => {
    expect(getTurnoPorDia(refSemanA, new Date("2026-06-07T00:00:00Z"))).toBe("T2");
  });

  it("Semana B (+1 semana) — Lunes (Jun 8) → T1", () => {
    expect(getTurnoPorDia(refSemanA, new Date("2026-06-08T00:00:00Z"))).toBe("T1");
  });

  it("Semana B — Miércoles (Jun 10) → LIBRE", () => {
    expect(getTurnoPorDia(refSemanA, new Date("2026-06-10T00:00:00Z"))).toBe("LIBRE");
  });

  it("Semana B — Jueves (Jun 11) → T2", () => {
    expect(getTurnoPorDia(refSemanA, new Date("2026-06-11T00:00:00Z"))).toBe("T2");
  });

  it("Semana B — Sábado (Jun 13) → T1", () => {
    expect(getTurnoPorDia(refSemanA, new Date("2026-06-13T00:00:00Z"))).toBe("T1");
  });

  it("+2 semanas — Lunes (Jun 15) → Semana A de nuevo → T2", () => {
    expect(getTurnoPorDia(refSemanA, new Date("2026-06-15T00:00:00Z"))).toBe("T2");
  });

  it("+3 semanas — Lunes (Jun 22) → Semana B → T1", () => {
    expect(getTurnoPorDia(refSemanA, new Date("2026-06-22T00:00:00Z"))).toBe("T1");
  });

  it("nunca retorna T3 en ningún día del ciclo completo", () => {
    const dias = [
      "2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04",
      "2026-06-05", "2026-06-06", "2026-06-07", "2026-06-08",
      "2026-06-09", "2026-06-10", "2026-06-11", "2026-06-12",
      "2026-06-13", "2026-06-14",
    ];
    dias.forEach((d) => {
      const turno = getTurnoPorDia(refSemanA, new Date(`${d}T00:00:00Z`));
      expect(turno).not.toBe("T3");
    });
  });
});

// -------------------------------------------------------------------
// MT_ALTERNO — Golden Master: todos los días de Junio 2026
// Fuente: calendario real enviado por Eli Daniel (cliente)
// M = Mañana = T1 (06:00–14:00)  |  T = Tarde = T2 (14:00–22:00)
// -------------------------------------------------------------------
describe("getTurnoPorDia — golden master Junio 2026 (calendario real)", () => {
  const ref = new Date("2026-06-01T00:00:00Z"); // Semana A de referencia

  const calendario: Array<[string, TurnoDia]> = [
    // Semana A
    ["2026-06-01", "T2"],   // Lun — T
    ["2026-06-02", "T2"],   // Mar — T
    ["2026-06-03", "LIBRE"],// Mié
    ["2026-06-04", "T1"],   // Jue — M
    ["2026-06-05", "T1"],   // Vie — M
    ["2026-06-06", "T2"],   // Sáb — T
    ["2026-06-07", "T2"],   // Dom — T
    // Semana B
    ["2026-06-08", "T1"],   // Lun — M
    ["2026-06-09", "T1"],   // Mar — M
    ["2026-06-10", "LIBRE"],// Mié
    ["2026-06-11", "T2"],   // Jue — T
    ["2026-06-12", "T2"],   // Vie — T
    ["2026-06-13", "T1"],   // Sáb — M
    ["2026-06-14", "T1"],   // Dom — M
    // Semana A (+2)
    ["2026-06-15", "T2"],   // Lun — T
    ["2026-06-16", "T2"],   // Mar — T
    ["2026-06-17", "LIBRE"],// Mié
    ["2026-06-18", "T1"],   // Jue — M
    ["2026-06-19", "T1"],   // Vie — M
    ["2026-06-20", "T2"],   // Sáb — T
    ["2026-06-21", "T2"],   // Dom — T
    // Semana B (+3)
    ["2026-06-22", "T1"],   // Lun — M
    ["2026-06-23", "T1"],   // Mar — M
    ["2026-06-24", "LIBRE"],// Mié
    ["2026-06-25", "T2"],   // Jue — T
    ["2026-06-26", "T2"],   // Vie — T
    ["2026-06-27", "T1"],   // Sáb — M
    ["2026-06-28", "T1"],   // Dom — M
    // Semana A (+4)
    ["2026-06-29", "T2"],   // Lun — T
    ["2026-06-30", "T2"],   // Mar — T
  ];

  it.each(calendario)("%s → %s", (fecha, esperado) => {
    expect(getTurnoPorDia(ref, new Date(`${fecha}T00:00:00Z`))).toBe(esperado);
  });
});

describe("getDiasLibres — MT_ALTERNO", () => {
  it("MT_ALTERNO → libre solo Miércoles(3)", () => {
    expect(getDiasLibres("MT_ALTERNO")).toEqual([3]);
  });
});
