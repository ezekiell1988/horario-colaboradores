"use client";

import { useEffect, useState } from "react";

const TURNO_LABELS: Record<string, { nombre: string; horario: string }> = {
  T1: { nombre: "Mañana", horario: "06:00 – 14:00" },
  T2: { nombre: "Tarde",  horario: "14:00 – 22:00" },
  T3: { nombre: "Noche",  horario: "22:00 – 06:00" },
};

const TURNO_COLORS: Record<string, string> = {
  T1: "bg-blue-100 text-blue-800 border-blue-200",
  T2: "bg-amber-100 text-amber-800 border-amber-200",
  T3: "bg-purple-100 text-purple-800 border-purple-200",
};

function formatSemana(fecha: string): string {
  const lunes = new Date(`${fecha}T00:00:00Z`);
  const domingo = new Date(lunes);
  domingo.setUTCDate(lunes.getUTCDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-CR", { day: "numeric", month: "long", timeZone: "UTC" });
  return `${fmt(lunes)} – ${fmt(domingo)}`;
}

type TurnoData = {
  nombre: string;
  grupo: string;
  modalidad: string;
  semanaActual: string;
  turnoActual: string;
  semanaProxima: string;
  turnoProximo: string;
};

export default function OficialPage() {
  const [data, setData] = useState<TurnoData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/oficial/turno")
      .then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e.error));
        return r.json();
      })
      .then(setData)
      .catch((e: string) => setError(e ?? "Error al cargar tu turno."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-center text-gray-400 py-20">Cargando...</p>;
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      {/* Saludo */}
      <div className="mb-6">
        <p className="text-gray-500 text-sm">Bienvenido,</p>
        <h1 className="text-2xl font-bold text-gray-900">{data.nombre}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Grupo: {data.grupo}
          {data.modalidad === "FIJO" && (
            <span className="ml-2 inline-block rounded-full bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5">
              Turno fijo
            </span>
          )}
          {data.modalidad === "MT" && (
            <span className="ml-2 inline-block rounded-full bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5">
              Turno doble
            </span>
          )}
        </p>
      </div>

      {/* Turno actual */}
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Esta semana</p>
        <div
          className={`rounded-2xl border-2 px-5 py-5 ${TURNO_COLORS[data.turnoActual] ?? "bg-gray-50 border-gray-200"}`}
        >
          <p className="text-4xl font-black tracking-tight">
            {TURNO_LABELS[data.turnoActual]?.nombre ?? data.turnoActual}
          </p>
          <p className="text-sm font-medium mt-1">
            {TURNO_LABELS[data.turnoActual]?.horario}
          </p>
          <p className="text-xs mt-2 opacity-70">{formatSemana(data.semanaActual)}</p>
        </div>
      </div>

      {/* Turno próximo */}
      <div>
        <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Próxima semana</p>
        <div
          className={`rounded-2xl border px-5 py-4 opacity-75 ${TURNO_COLORS[data.turnoProximo] ?? "bg-gray-50 border-gray-200"}`}
        >
          <p className="text-2xl font-bold">
            {TURNO_LABELS[data.turnoProximo]?.nombre ?? data.turnoProximo}
          </p>
          <p className="text-sm mt-0.5">
            {TURNO_LABELS[data.turnoProximo]?.horario}
          </p>
          <p className="text-xs mt-1 opacity-70">{formatSemana(data.semanaProxima)}</p>
        </div>
      </div>
    </div>
  );
}
