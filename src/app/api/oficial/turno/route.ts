import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTurnoEfectivo, getTurnoForWeek, getWeekStart, Modalidad } from "@/lib/roll-engine";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      colaborador: {
        include: { grupo: true },
      },
    },
  });

  if (!user?.colaborador) {
    return NextResponse.json(
      { error: "Tu usuario no tiene un colaborador asignado." },
      { status: 404 },
    );
  }

  const { colaborador } = user;
  const now = new Date();

  const semanaActual = getWeekStart(now);
  const semanaProxima = new Date(semanaActual);
  semanaProxima.setUTCDate(semanaActual.getUTCDate() + 7);

  const modalidad = (colaborador.modalidad ?? "FULL") as Modalidad;
  const turnoFijo = colaborador.turnoFijo ?? null;

  const turnoSemanaActual = getTurnoForWeek(colaborador.grupo, semanaActual);
  const turnoSemanaProxima = getTurnoForWeek(colaborador.grupo, semanaProxima);

  const turnoActual = getTurnoEfectivo(modalidad, turnoFijo, turnoSemanaActual);
  const turnoProximo = getTurnoEfectivo(modalidad, turnoFijo, turnoSemanaProxima);

  return NextResponse.json({
    nombre: colaborador.nombre,
    grupo: colaborador.grupo.nombre,
    modalidad,
    semanaActual: semanaActual.toISOString().split("T")[0],
    turnoActual,
    semanaProxima: semanaProxima.toISOString().split("T")[0],
    turnoProximo,
  });
}
