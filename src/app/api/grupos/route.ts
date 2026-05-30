import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const grupos = await prisma.grupo.findMany({
    include: { _count: { select: { colaboradores: true } } },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json(grupos);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { nombre, turnoInicioIndex, fechaInicioRotacion } = await req.json();

  if (!nombre || turnoInicioIndex === undefined || !fechaInicioRotacion) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const grupo = await prisma.grupo.create({
    data: {
      nombre,
      turnoInicioIndex: Number(turnoInicioIndex),
      fechaInicioRotacion: new Date(fechaInicioRotacion),
    },
  });

  return NextResponse.json(grupo, { status: 201 });
}
