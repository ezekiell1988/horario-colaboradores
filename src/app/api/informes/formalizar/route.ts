import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { formalizarTexto } from "@/lib/azure-ai";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.rol !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json() as { borrador: string };
  if (!body.borrador?.trim()) {
    return NextResponse.json({ error: "El borrador no puede estar vacío" }, { status: 400 });
  }

  const textoFormal = await formalizarTexto(body.borrador);
  return NextResponse.json({ textoFormal });
}
