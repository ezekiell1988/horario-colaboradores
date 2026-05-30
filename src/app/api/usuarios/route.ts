import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const ROLES_VALIDOS = ["admin", "coordinador", "oficial"];

export async function GET() {
  const session = await auth();
  if (!session || session.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const usuarios = await prisma.user.findMany({
    orderBy: { email: "asc" },
    select: {
      id: true,
      email: true,
      rol: true,
      colaboradorId: true,
      colaborador: { select: { nombre: true } },
    },
  });

  return NextResponse.json(usuarios);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    email?: string;
    password?: string;
    rol?: string;
    colaboradorId?: string | null;
  };

  if (!body.email || !body.password || !body.rol) {
    return NextResponse.json({ error: "Campos requeridos: email, password, rol" }, { status: 400 });
  }

  if (!ROLES_VALIDOS.includes(body.rol)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const existe = await prisma.user.findUnique({ where: { email: body.email } });
  if (existe) {
    return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(body.password, 12);

  const usuario = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      rol: body.rol,
      colaboradorId: body.rol === "oficial" ? (body.colaboradorId ?? null) : null,
    },
    select: { id: true, email: true, rol: true, colaboradorId: true },
  });

  return NextResponse.json(usuario, { status: 201 });
}
