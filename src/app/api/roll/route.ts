import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTurnoForWeek, getTurnoEfectivo } from "@/lib/roll-engine";
import type { Modalidad } from "@/lib/roll-engine";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const grupoId = searchParams.get("grupoId");
  const fecha = searchParams.get("fecha"); // ISO: "2026-01-05"

  if (!grupoId || !fecha) {
    return NextResponse.json({ error: "Parámetros requeridos: grupoId, fecha" }, { status: 400 });
  }

  const grupo = await prisma.grupo.findUnique({
    where: { id: grupoId },
    include: {
      colaboradores: {
        where: { activo: true },
        orderBy: { nombre: "asc" },
      },
    },
  });

  if (!grupo) {
    return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
  }

  const turno = getTurnoForWeek(grupo, new Date(fecha));

  return NextResponse.json({
    grupoId: grupo.id,
    grupoNombre: grupo.nombre,
    turno,
    semana: fecha,
    colaboradores: grupo.colaboradores.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      modalidad: c.modalidad,
      turnoFijo: c.turnoFijo,
      turnoEfectivo: getTurnoEfectivo((c.modalidad as Modalidad) ?? "FULL", c.turnoFijo ?? null, turno),
    })),
  });
}
