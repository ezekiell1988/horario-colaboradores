"use client";

import { useCallback, useEffect, useState } from "react";
import ReportEditor from "@/components/ReportEditor";

interface InformeListItem {
  id: string;
  fecha: string;
  titulo: string;
  creadoAt: string;
  textoFormal: string | null;
}

interface InformeDetalle extends InformeListItem {
  contenido: string;
}

function getMesStr(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getFechaStr(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function InformesPage() {
  const hoy = new Date();
  const [mes, setMes] = useState<string>(getMesStr(hoy));
  const [fecha, setFecha] = useState<string>(getFechaStr(hoy));
  const [lista, setLista] = useState<InformeListItem[]>([]);
  const [activo, setActivo] = useState<InformeDetalle | null>(null);
  const [creando, setCreando] = useState(false);
  const [loadingLista, setLoadingLista] = useState(false);

  const cargarLista = useCallback(async () => {
    setLoadingLista(true);
    try {
      const res = await fetch(`/api/informes?mes=${mes}`);
      const data = (await res.json()) as InformeListItem[];
      setLista(Array.isArray(data) ? data : []);
    } finally {
      setLoadingLista(false);
    }
  }, [mes]);

  useEffect(() => {
    cargarLista();
  }, [cargarLista]);

  async function abrirInforme(id: string) {
    const res = await fetch(`/api/informes/${id}`);
    const data = (await res.json()) as InformeDetalle;
    setActivo(data);
  }

  async function crearInforme() {
    setCreando(true);
    try {
      const res = await fetch("/api/informes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha }),
      });
      const data = (await res.json()) as InformeDetalle & { contenido: string };
      await cargarLista();
      setActivo({ ...data, contenido: data.contenido ?? "" });
    } finally {
      setCreando(false);
    }
  }

  function navMes(delta: number) {
    const [y, m] = mes.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    setMes(getMesStr(d));
    setActivo(null);
  }

  const mesLabel = new Date(`${mes}-01T12:00:00Z`).toLocaleDateString("es-CR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex gap-6 min-h-[calc(100vh-4rem)]">
      {/* Sidebar — historial del mes */}
      <aside className="w-64 shrink-0 space-y-4">
        {/* Navegación de mes */}
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2">
          <button
            type="button"
            onClick={() => navMes(-1)}
            aria-label="Mes anterior"
            className="text-gray-500 hover:text-gray-800 px-1"
          >
            ‹
          </button>
          <span className="text-sm font-medium capitalize text-gray-700">{mesLabel}</span>
          <button
            type="button"
            onClick={() => navMes(1)}
            aria-label="Mes siguiente"
            className="text-gray-500 hover:text-gray-800 px-1"
          >
            ›
          </button>
        </div>

        {/* Crear nuevo */}
        <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
          <label htmlFor="fecha-nuevo-informe" className="block text-xs font-medium text-gray-600">
            Nuevo informe
          </label>
          <input
            id="fecha-nuevo-informe"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={crearInforme}
            disabled={creando}
            className="w-full py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {creando ? "Creando…" : "+ Nuevo"}
          </button>
        </div>

        {/* Lista */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {loadingLista ? (
            <p className="text-sm text-gray-500 p-4 text-center">Cargando…</p>
          ) : lista.length === 0 ? (
            <p className="text-sm text-gray-400 p-4 text-center">Sin informes este mes</p>
          ) : (
            <ul>
              {lista.map((inf) => (
                <li key={inf.id}>
                  <button
                    type="button"
                    onClick={() => abrirInforme(inf.id)}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                      activo?.id === inf.id ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700"
                    }`}
                  >
                    <p className="truncate">{inf.titulo}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(inf.fecha).toLocaleDateString("es-CR", {
                        day: "2-digit",
                        month: "short",
                        timeZone: "UTC",
                      })}
                      {inf.textoFormal && (
                        <span className="ml-1.5 text-indigo-500">✦</span>
                      )}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Editor */}
      <main className="flex-1">
        {activo ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <ReportEditor
              key={activo.id}
              informeId={activo.id}
              initialTitulo={activo.titulo}
              initialContenido={activo.contenido}
              initialTextoFormal={activo.textoFormal}
              onSaved={cargarLista}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Selecciona un informe o crea uno nuevo
          </div>
        )}
      </main>
    </div>
  );
}
