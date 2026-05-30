import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !["admin", "coordinador"].includes(session.user.rol)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as { estado?: string; puesto?: string };

  const ESTADOS_VALIDOS = ["presente", "ausente", "permiso"];
  if (body.estado !== undefined && !ESTADOS_VALIDOS.includes(body.estado)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const updated = await prisma.asistencia.update({
    where: { id },
    data: {
      ...(body.estado !== undefined && { estado: body.estado }),
      ...(body.puesto !== undefined && { puesto: body.puesto }),
    },
  });

  return NextResponse.json(updated);
}
