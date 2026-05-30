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
  const { nombre, grupoId, activo, puesto, modalidad, turnoFijo, fechaInicioPersonal, diaLibre, diaLibreExtra } = await req.json();

  const DIAS_SEMANA = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
  const modalidadValida = ["FULL", "MT", "FIJO", "MT_ALTERNO"].includes(modalidad) ? modalidad : undefined;
  const turnoFijoValido = modalidadValida === "FIJO" && ["T1", "T2"].includes(turnoFijo) ? turnoFijo : (modalidadValida && modalidadValida !== "FIJO" ? null : undefined);

  const fechaInicioPersonalValida = modalidadValida === "MT_ALTERNO" && fechaInicioPersonal
    ? new Date(fechaInicioPersonal)
    : (modalidadValida && modalidadValida !== "MT_ALTERNO" ? null : undefined);

  const diaLibreValido = diaLibre !== undefined ? (DIAS_SEMANA.includes(diaLibre) ? diaLibre : null) : undefined;
  const diaLibreExtraValido = diaLibreExtra !== undefined ? (DIAS_SEMANA.includes(diaLibreExtra) ? diaLibreExtra : null) : undefined;

  const colaborador = await prisma.colaborador.update({
    where: { id },
    data: {
      nombre,
      grupoId,
      activo,
      puesto: puesto ?? undefined,
      ...(modalidadValida !== undefined && { modalidad: modalidadValida }),
      ...(turnoFijoValido !== undefined && { turnoFijo: turnoFijoValido }),
      ...(fechaInicioPersonalValida !== undefined && { fechaInicioPersonal: fechaInicioPersonalValida }),
      ...(diaLibreValido !== undefined && { diaLibre: diaLibreValido }),
      ...(diaLibreExtraValido !== undefined && { diaLibreExtra: diaLibreExtraValido }),
    },
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
