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
  const { nombre, grupoId, activo, puesto } = await req.json();

  const colaborador = await prisma.colaborador.update({
    where: { id },
    data: { nombre, grupoId, activo, puesto: puesto ?? undefined },
    include: { grupo: { select: { id: true, nombre: true } } },
  });

  return NextResponse.json(colaborador);
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
  await prisma.colaborador.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
