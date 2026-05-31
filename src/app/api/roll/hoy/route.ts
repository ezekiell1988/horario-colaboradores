import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTurnoForWeek, getDiasLibres, getDiasLibresColaborador, getWeekStart, getTurnoEfectivo, nowCR } from "@/lib/roll-engine";
import type { Turno, Modalidad } from "@/lib/roll-engine";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const hoy = nowCR(); // fecha actual en zona horaria Costa Rica (GMT-6)
  const semanaActual = getWeekStart(hoy);

  // Todos los grupos con sus colaboradores activos
  const grupos = await prisma.grupo.findMany({
    include: {
      colaboradores: {
        where: { activo: true },
        orderBy: { nombre: "asc" },
      },
    },
    orderBy: { nombre: "asc" },
  });

  // Excepciones de la semana actual
  const excepciones = await prisma.excepcionRoll.findMany({
    where: { semana: semanaActual },
  });
  const excepcionMap = new Map(excepciones.map((e) => [e.colaboradorId, e.tipo]));

  type ColaboradorHoy = {
    id: string;
    nombre: string;
    puesto: string | null;
    grupoNombre: string;
    excepcion: string | null;
  };

  // Agrupar colaboradores por turno o libre
  const turnos: Record<Turno, ColaboradorHoy[]> = { T1: [], T2: [], T3: [] };
  const libre: ColaboradorHoy[] = [];

  const diaHoy = hoy.getUTCDay(); // 0=Dom … 6=Sáb

  for (const grupo of grupos) {
    const turno = getTurnoForWeek(grupo, hoy);

    for (const col of grupo.colaboradores) {
      const turnoEfectivo = getTurnoEfectivo(
        (col.modalidad as Modalidad) ?? "FULL",
        col.turnoFijo ?? null,
        turno,
      );
      const diasLibresPersonal = getDiasLibresColaborador(col.diaLibre ?? null, col.diaLibreExtra ?? null);
      const diasLibresEfectivos = diasLibresPersonal ?? getDiasLibres(turnoEfectivo);
      const esLibreEfectivo = diasLibresEfectivos.includes(diaHoy);

      const entry: ColaboradorHoy = {
        id: col.id,
        nombre: col.nombre,
        puesto: col.puesto ?? null,
        grupoNombre: grupo.nombre,
        excepcion: excepcionMap.get(col.id) ?? null,
      };
      if (esLibreEfectivo && !entry.excepcion) {
        libre.push(entry);
      } else {
        turnos[turnoEfectivo].push(entry);
      }
    }
  }

  return NextResponse.json({
    fecha: hoy.toISOString().split("T")[0],
    semana: semanaActual.toISOString().split("T")[0],
    turnos,
    libre,
  });
}
