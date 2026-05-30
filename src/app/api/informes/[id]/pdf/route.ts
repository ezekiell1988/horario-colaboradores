import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generarPDF } from "@/lib/pdf-exporter";

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
  if (!informe) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const cuerpo = informe.textoFormal ?? informe.contenido ?? "";
  if (!cuerpo.trim()) {
    return NextResponse.json({ error: "El informe no tiene contenido para exportar" }, { status: 422 });
  }

  const buffer = await generarPDF({
    titulo: informe.titulo,
    fecha: informe.fecha,
    cuerpo,
  });

  const fechaStr = informe.fecha.toISOString().slice(0, 10);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="informe-${fechaStr}.pdf"`,
    },
  });
}
