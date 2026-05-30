import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTurnoForWeek, getWeekStart } from "@/lib/roll-engine";
import type { Turno } from "@/lib/roll-engine";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const hoy = new Date();
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

  // Agrupar colaboradores por turno
  const turnos: Record<
    Turno,
    { id: string; nombre: string; grupoNombre: string; excepcion: string | null }[]
  > = { T1: [], T2: [], T3: [] };

  for (const grupo of grupos) {
    const turno = getTurnoForWeek(grupo, hoy);
    for (const col of grupo.colaboradores) {
      turnos[turno].push({
        id: col.id,
        nombre: col.nombre,
        grupoNombre: grupo.nombre,
        excepcion: excepcionMap.get(col.id) ?? null,
      });
    }
  }

  return NextResponse.json({
    fecha: hoy.toISOString().split("T")[0],
    semana: semanaActual.toISOString().split("T")[0],
    turnos,
  });
}
