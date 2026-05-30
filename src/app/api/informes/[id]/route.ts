import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const informe = await prisma.informe.findUnique({ where: { id } });
  if (!informe) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(informe);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as {
    titulo?: string;
    contenido?: string;
    textoFormal?: string;
  };

  const informe = await prisma.informe.update({
    where: { id },
    data: {
      ...(body.titulo !== undefined && { titulo: body.titulo }),
      ...(body.contenido !== undefined && { contenido: body.contenido }),
      ...(body.textoFormal !== undefined && { textoFormal: body.textoFormal }),
    },
  });

  return NextResponse.json(informe);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.informe.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
