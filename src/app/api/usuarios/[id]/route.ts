import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const ROLES_VALIDOS = ["admin", "coordinador", "oficial"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json()) as {
    email?: string;
    password?: string;
    rol?: string;
    colaboradorId?: string | null;
  };

  if (body.rol !== undefined && !ROLES_VALIDOS.includes(body.rol)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.email !== undefined) data.email = body.email;
  if (body.rol !== undefined) {
    data.rol = body.rol;
    // Si cambia a no-oficial, limpiar colaboradorId
    if (body.rol !== "oficial") data.colaboradorId = null;
  }
  if (body.colaboradorId !== undefined) data.colaboradorId = body.colaboradorId ?? null;
  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 12);

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, rol: true, colaboradorId: true },
  });

  return NextResponse.json(updated);
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

  // No permitir eliminar al usuario que hace la petición
  if (id === session.user.id) {
    return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
