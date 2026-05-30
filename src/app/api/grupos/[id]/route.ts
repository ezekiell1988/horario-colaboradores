import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { nombre, turnoInicioIndex, fechaInicioRotacion } = await req.json();

  const grupo = await prisma.grupo.update({
    where: { id },
    data: {
      nombre,
      turnoInicioIndex: Number(turnoInicioIndex),
      fechaInicioRotacion: new Date(fechaInicioRotacion),
    },
  });

  return NextResponse.json(grupo);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const count = await prisma.colaborador.count({ where: { grupoId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: "El grupo tiene colaboradores asignados" },
      { status: 409 },
    );
  }

  await prisma.grupo.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
