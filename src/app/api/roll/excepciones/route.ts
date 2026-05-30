import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/roll/excepciones?grupoId=X&semana=YYYY-MM-DD
 * Devuelve las excepciones de todos los colaboradores de un grupo para una semana dada.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const grupoId = searchParams.get("grupoId");
  const semana = searchParams.get("semana");

  if (!grupoId || !semana) {
    return NextResponse.json({ error: "grupoId y semana son requeridos" }, { status: 400 });
  }

  const semanaDate = new Date(`${semana}T00:00:00Z`);
  if (isNaN(semanaDate.getTime())) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  // Obtener colaboradores del grupo
  const colaboradores = await prisma.colaborador.findMany({
    where: { grupoId, activo: true },
    select: { id: true },
  });
  const ids = colaboradores.map((c) => c.id);

  if (ids.length === 0) return NextResponse.json([]);

  const excepciones = await prisma.excepcionRoll.findMany({
    where: {
      colaboradorId: { in: ids },
      semana: semanaDate,
    },
  });

  return NextResponse.json(excepciones);
}

/** POST /api/roll/excepciones
 * Body: { colaboradorId, semana, tipo }
 * Si tipo === "" → elimina la excepción.
 * Si tipo tiene valor → upsert.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json() as { colaboradorId?: string; semana?: string; tipo?: string; nota?: string };
  const { colaboradorId, semana, tipo, nota } = body;

  if (!colaboradorId || !semana) {
    return NextResponse.json({ error: "colaboradorId y semana son requeridos" }, { status: 400 });
  }

  const semanaDate = new Date(`${semana}T00:00:00Z`);
  if (isNaN(semanaDate.getTime())) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  const TIPOS_VALIDOS = ["vacaciones", "permiso", "ausencia"];

  // Si tipo está vacío o nulo → eliminar excepción
  if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
    await prisma.excepcionRoll.deleteMany({
      where: { colaboradorId, semana: semanaDate },
    });
    return NextResponse.json({ deleted: true });
  }

  const excepcion = await prisma.excepcionRoll.upsert({
    where: {
      colaboradorId_semana: { colaboradorId, semana: semanaDate },
    },
    update: { tipo, nota: nota ?? null },
    create: { colaboradorId, semana: semanaDate, tipo, nota: nota ?? null },
  });

  return NextResponse.json(excepcion);
}
