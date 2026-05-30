"use client";

import { useEffect, useState } from "react";
import { showToast } from "@/lib/toast";

type Colaborador = {
  id: string;
  nombre: string;
  puesto: string | null;
  grupoNombre: string;
  excepcion: string | null;
};

type Turnos = {
  T1: Colaborador[];
  T2: Colaborador[];
  T3: Colaborador[];
};

type HoyData = {
  fecha: string;
  semana: string;
  turnos: Turnos;
  libre: Colaborador[];
};

const TURNO_CONFIG = {
  T1: { nombre: "Mañana", label: "06:00 – 14:00", bg: "bg-sky-50", border: "border-sky-200", header: "bg-sky-100 text-sky-800" },
  T2: { nombre: "Tarde",  label: "14:00 – 22:00", bg: "bg-amber-50", border: "border-amber-200", header: "bg-amber-100 text-amber-800" },
  T3: { nombre: "Noche",  label: "22:00 – 06:00", bg: "bg-indigo-50", border: "border-indigo-200", header: "bg-indigo-100 text-indigo-800" },
} as const;

const EXCEPCION_LABEL: Record<string, string> = {
  vacaciones: "Vacaciones",
  permiso: "Permiso",
  ausencia: "Ausencia",
};

function formatFecha(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  return fecha.toLocaleDateString("es-CR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function HoyPage() {
  const [data, setData] = useState<HoyData | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const r = await fetch("/api/roll/hoy");
        if (!r.ok) throw new Error();
        setData(await r.json());
      } catch {
        showToast("Error al cargar el roll de hoy");
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Cargando…
      </div>
    );
  }

  if (!data) return null;

  const fecha = formatFecha(data.fecha);
  const totalColabs = Object.values(data.turnos).flat().length + data.libre.length;

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div>
        <h1 className="text-lg font-bold text-gray-900 capitalize">{fecha}</h1>
        <p className="text-sm text-gray-500">
          {totalColabs} colaborador{totalColabs !== 1 ? "es" : ""} activo{totalColabs !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Tarjetas por turno + Libre */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(["T1", "T2", "T3"] as const).map((turno) => {
          const cfg = TURNO_CONFIG[turno];
          const cols = data.turnos[turno];
          const activos = cols.filter((c) => !c.excepcion);
          const fuera = cols.filter((c) => c.excepcion);

          return (
            <div
              key={turno}
              className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}
            >
              {/* Header de la tarjeta */}
              <div className={`px-4 py-3 ${cfg.header}`}>
                <div className="font-bold text-base">{cfg.nombre}</div>
                <div className="text-xs font-medium opacity-80">{cfg.label}</div>
                <div className="text-xs mt-0.5 opacity-70">
                  {activos.length} en turno{fuera.length > 0 ? ` · ${fuera.length} fuera` : ""}
                </div>
              </div>

              {/* Lista */}
              <ul className="divide-y divide-white/60 px-4 py-2">
                {cols.length === 0 && (
                  <li className="py-3 text-sm text-gray-400 text-center">Sin asignaciones</li>
                )}
                {activos.map((c) => (
                  <li key={c.id} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-800 block truncate">{c.nombre}</span>
                      {c.puesto && <span className="text-xs text-gray-400">{c.puesto}</span>}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{c.grupoNombre}</span>
                  </li>
                ))}
                {fuera.map((c) => (
                  <li key={c.id} className="py-2 flex items-center justify-between gap-2 opacity-50">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-500 line-through block truncate">{c.nombre}</span>
                      {c.puesto && <span className="text-xs text-gray-400">{c.puesto}</span>}
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded shrink-0">
                      {EXCEPCION_LABEL[c.excepcion!] ?? c.excepcion}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {/* Tarjeta Libre — solo si hay colaboradores libres hoy */}
        {data.libre.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
            <div className="px-4 py-3 bg-gray-100 text-gray-700">
              <div className="font-bold text-base">Libre</div>
              <div className="text-xs font-medium opacity-70">Día libre</div>
              <div className="text-xs mt-0.5 opacity-60">{data.libre.length} colaborador{data.libre.length !== 1 ? "es" : ""}</div>
            </div>
            <ul className="divide-y divide-white/60 px-4 py-2">
              {data.libre.map((c) => (
                <li key={c.id} className="py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-gray-700 block truncate">{c.nombre}</span>
                    {c.puesto && <span className="text-xs text-gray-400">{c.puesto}</span>}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{c.grupoNombre}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
