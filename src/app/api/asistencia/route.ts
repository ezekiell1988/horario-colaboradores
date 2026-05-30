import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTurnoForWeek, getWeekStart } from "@/lib/roll-engine";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || session.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fechaParam = searchParams.get("fecha"); // YYYY-MM-DD

  if (!fechaParam) {
    return NextResponse.json({ error: "Parámetro requerido: fecha" }, { status: 400 });
  }

  const fecha = new Date(`${fechaParam}T00:00:00Z`);
  const lunes = getWeekStart(fecha);

  // Obtener todos los grupos activos con sus colaboradores activos
  const grupos = await prisma.grupo.findMany({
    include: {
      colaboradores: {
        where: { activo: true },
        orderBy: { nombre: "asc" },
      },
    },
  });

  // Para cada colaborador activo, obtener o crear su registro de asistencia para ese día
  const colaboradoresConTurno = grupos.flatMap((grupo) => {
    const turno = getTurnoForWeek(grupo, lunes);
    return grupo.colaboradores.map((c) => ({ colaborador: c, grupoNombre: grupo.nombre, turno }));
  });

  if (colaboradoresConTurno.length === 0) {
    return NextResponse.json([]);
  }

  // Upsert de registros de asistencia (crea con "presente" si no existen)
  await Promise.all(
    colaboradoresConTurno.map(({ colaborador, turno }) =>
      prisma.asistencia.upsert({
        where: { colaboradorId_fecha: { colaboradorId: colaborador.id, fecha } },
        create: {
          colaboradorId: colaborador.id,
          fecha,
          turno,
          puesto: "",
          estado: "presente",
        },
        update: {},
      }),
    ),
  );

  // Leer los registros ya existentes/creados
  const registros = await prisma.asistencia.findMany({
    where: { fecha },
    include: { colaborador: { include: { grupo: true } } },
    orderBy: [{ colaborador: { grupo: { nombre: "asc" } } }, { colaborador: { nombre: "asc" } }],
  });

  return NextResponse.json(
    registros.map((r) => ({
      id: r.id,
      colaboradorId: r.colaboradorId,
      nombre: r.colaborador.nombre,
      grupo: r.colaborador.grupo.nombre,
      turno: r.turno,
      puesto: r.puesto,
      estado: r.estado,
    })),
  );
}
