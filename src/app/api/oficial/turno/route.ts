import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTurnoForWeek, getWeekStart } from "@/lib/roll-engine";

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

  const turnoActual = getTurnoForWeek(colaborador.grupo, semanaActual);
  const turnoProximo = getTurnoForWeek(colaborador.grupo, semanaProxima);

  return NextResponse.json({
    nombre: colaborador.nombre,
    grupo: colaborador.grupo.nombre,
    semanaActual: semanaActual.toISOString().split("T")[0],
    turnoActual,
    semanaProxima: semanaProxima.toISOString().split("T")[0],
    turnoProximo,
  });
}
