import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes"); // "YYYY-MM"

  let dateFilter = {};
  if (mes) {
    const [year, month] = mes.split("-").map(Number);
    const inicio = new Date(Date.UTC(year, month - 1, 1));
    const fin = new Date(Date.UTC(year, month, 1));
    dateFilter = { fecha: { gte: inicio, lt: fin } };
  }

  const informes = await prisma.informe.findMany({
    where: dateFilter,
    orderBy: { fecha: "desc" },
    select: {
      id: true,
      fecha: true,
      titulo: true,
      creadoAt: true,
      textoFormal: true,
    },
  });

  return NextResponse.json(informes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json() as { fecha: string; titulo?: string; contenido?: string };
  if (!body.fecha) {
    return NextResponse.json({ error: "Campo requerido: fecha" }, { status: 400 });
  }

  const informe = await prisma.informe.create({
    data: {
      fecha: new Date(`${body.fecha}T00:00:00Z`),
      titulo: body.titulo ?? `Informe ${body.fecha}`,
      contenido: body.contenido ?? "",
      creadoPor: session.user.id,
    },
  });

  return NextResponse.json(informe, { status: 201 });
}
