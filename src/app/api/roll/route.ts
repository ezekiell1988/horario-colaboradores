import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTurnoForWeek, getTurnoEfectivo, getTurnoPorDia } from "@/lib/roll-engine";
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

  // Para MT_ALTERNO calculamos el turno por cada día de la semana
  const fechaBase = new Date(fecha);
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(fechaBase);
    d.setUTCDate(fechaBase.getUTCDate() + i);
    return d;
  });

  return NextResponse.json({
    grupoId: grupo.id,
    grupoNombre: grupo.nombre,
    turno,
    semana: fecha,
    colaboradores: grupo.colaboradores.map((c) => {
      const modalidad = (c.modalidad as Modalidad) ?? "FULL";
      if (modalidad === "MT_ALTERNO" && c.fechaInicioPersonal) {
        const ref = new Date(c.fechaInicioPersonal);
        const turnoPorDia = dias.map((d) => ({
          fecha: d.toISOString().split("T")[0],
          turno: getTurnoPorDia(ref, d),
        }));
        return {
          id: c.id,
          nombre: c.nombre,
          modalidad,
          turnoFijo: c.turnoFijo,
          turnoEfectivo: null,
          turnoPorDia,
        };
      }
      return {
        id: c.id,
        nombre: c.nombre,
        modalidad,
        turnoFijo: c.turnoFijo,
        turnoEfectivo: getTurnoEfectivo(modalidad, c.turnoFijo ?? null, turno),
        turnoPorDia: null,
      };
    }),
  });
}
