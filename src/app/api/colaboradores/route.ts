import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const colaboradores = await prisma.colaborador.findMany({
    include: { grupo: { select: { id: true, nombre: true } } },
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
  });

  return NextResponse.json(colaboradores);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { nombre, grupoId, puesto, modalidad, turnoFijo, fechaInicioPersonal, diaLibre, diaLibreExtra } = await req.json();

  if (!nombre || !grupoId) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const DIAS_SEMANA = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
  const modalidadValida = ["FULL", "MT", "FIJO", "MT_ALTERNO"].includes(modalidad) ? modalidad : "FULL";
  const turnoFijoValido = modalidadValida === "FIJO" && ["T1", "T2"].includes(turnoFijo) ? turnoFijo : null;
  const diaLibreValido = DIAS_SEMANA.includes(diaLibre) ? diaLibre : null;
  const diaLibreExtraValido = DIAS_SEMANA.includes(diaLibreExtra) ? diaLibreExtra : null;

  if (modalidadValida === "MT_ALTERNO" && !fechaInicioPersonal) {
    return NextResponse.json({ error: "Fecha de inicio personal requerida para MT_ALTERNO" }, { status: 400 });
  }
  const fechaInicioPersonalValida = modalidadValida === "MT_ALTERNO" && fechaInicioPersonal
    ? new Date(fechaInicioPersonal)
    : null;

  const colaborador = await prisma.colaborador.create({
    data: { nombre, grupoId, puesto: puesto || null, modalidad: modalidadValida, turnoFijo: turnoFijoValido, fechaInicioPersonal: fechaInicioPersonalValida, diaLibre: diaLibreValido, diaLibreExtra: diaLibreExtraValido },
    include: { grupo: { select: { id: true, nombre: true } } },
  });

  return NextResponse.json(colaborador, { status: 201 });
}
