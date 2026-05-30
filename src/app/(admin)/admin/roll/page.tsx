"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const TURNO_LABELS: Record<string, string> = {
  T1: "T1 — 06:00–14:00",
  T2: "T2 — 14:00–22:00",
  T3: "T3 — 22:00–06:00",
};

const TURNO_COLORS: Record<string, string> = {
  T1: "bg-blue-100 text-blue-800",
  T2: "bg-amber-100 text-amber-800",
  T3: "bg-purple-100 text-purple-800",
};

const EXCEPCION_LABELS: Record<string, string> = {
  vacaciones: "Vacaciones",
  permiso: "Permiso",
  ausencia: "Ausencia",
};

const EXCEPCION_COLORS: Record<string, string> = {
  vacaciones: "bg-green-100 text-green-700 border-green-200",
  permiso: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ausencia: "bg-red-100 text-red-700 border-red-200",
};

type Grupo = { id: string; nombre: string };
type Colaborador = { id: string; nombre: string };
type RollData = {
  grupoId: string;
  grupoNombre: string;
  turno: string;
  semana: string;
  colaboradores: Colaborador[];
};
type ExcepcionRoll = {
  id: string;
  colaboradorId: string;
  semana: string;
  tipo: string;
};

/** Devuelve el lunes de la semana actual en formato YYYY-MM-DD (UTC) */
function getThisMonday(): string {
  const today = new Date();
  const d = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split("T")[0];
}

/** Suma/resta semanas a una fecha YYYY-MM-DD */
function shiftWeek(fecha: string, weeks: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().split("T")[0];
}

function formatSemana(fecha: string): string {
  const lunes = new Date(`${fecha}T00:00:00Z`);
  const domingo = new Date(lunes);
  domingo.setUTCDate(lunes.getUTCDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-CR", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${fmt(lunes)} – ${fmt(domingo)}`;
}

export default function RollPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoId, setGrupoId] = useState("");
  const [semana, setSemana] = useState(getThisMonday());
  const [roll, setRoll] = useState<RollData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingGrupos, setLoadingGrupos] = useState(true);
  const [excepciones, setExcepciones] = useState<ExcepcionRoll[]>([]);
  const [savingExc, setSavingExc] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/grupos")
      .then((r) => r.json())
      .then((g: Grupo[]) => {
        setGrupos(g);
        if (g.length > 0) setGrupoId(g[0].id);
      })
      .finally(() => setLoadingGrupos(false));
  }, []);

  const fetchExcepciones = useCallback((gId: string, s: string) => {
    fetch(`/api/roll/excepciones?grupoId=${gId}&semana=${s}`)
      .then((r) => r.json())
      .then((data: ExcepcionRoll[]) => setExcepciones(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    if (!grupoId) return;
    setLoading(true);
    fetch(`/api/roll?grupoId=${grupoId}&fecha=${semana}`)
      .then((r) => r.json())
      .then(setRoll)
      .finally(() => setLoading(false));
    fetchExcepciones(grupoId, semana);
  }, [grupoId, semana, fetchExcepciones]);

  async function handleExcepcion(colaboradorId: string, tipo: string) {
    setSavingExc((s) => ({ ...s, [colaboradorId]: true }));
    try {
      await fetch("/api/roll/excepciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colaboradorId, semana, tipo }),
      });
      fetchExcepciones(grupoId, semana);
    } finally {
      setSavingExc((s) => ({ ...s, [colaboradorId]: false }));
    }
  }

  function getExcepcion(colaboradorId: string): string {
    return excepciones.find((e) => e.colaboradorId === colaboradorId)?.tipo ?? "";
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">Roll semanal</h1>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4 flex flex-col gap-3">
        <div>
          <label htmlFor="roll-grupo" className="block text-sm font-medium text-gray-700 mb-1">
            Grupo
          </label>
          {loadingGrupos ? (
            <p className="text-sm text-gray-400">Cargando grupos...</p>
          ) : (
            <select
              id="roll-grupo"
              value={grupoId}
              onChange={(e) => setGrupoId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {grupos.length === 0 && (
                <option value="">Sin grupos registrados</option>
              )}
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Navegación de semana */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Semana</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSemana((s) => shiftWeek(s, -1))}
              aria-label="Semana anterior"
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600"
            >
              ‹
            </button>
            <span className="flex-1 text-center text-sm font-medium text-gray-700">
              {formatSemana(semana)}
            </span>
            <button
              onClick={() => setSemana((s) => shiftWeek(s, 1))}
              aria-label="Semana siguiente"
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600"
            >
              ›
            </button>
          </div>
          <button
            onClick={() => setSemana(getThisMonday())}
            className="mt-1 text-xs text-blue-600 hover:underline"
          >
            Ir a esta semana
          </button>
        </div>
      </div>

      {/* Resultado */}
      {loading && (
        <p className="text-center text-gray-400 py-8">Cargando roll...</p>
      )}

      {!loading && !roll && grupos.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-2">No hay grupos registrados.</p>
          <Link href="/admin/grupos" className="text-blue-600 hover:underline text-sm">
            Crear grupo
          </Link>
        </div>
      )}

      {!loading && roll && (
        <div>
          <div
            className={`rounded-xl px-4 py-3 mb-4 font-semibold text-center text-base ${TURNO_COLORS[roll.turno] ?? "bg-gray-100 text-gray-700"}`}
          >
            {TURNO_LABELS[roll.turno] ?? roll.turno}
          </div>

          {roll.colaboradores.length === 0 ? (
            <p className="text-center text-gray-400 py-6">
              No hay colaboradores activos en este grupo.
            </p>
          ) : (
            <ul className="space-y-2">
              {roll.colaboradores.map((c) => {
                const excTipo = getExcepcion(c.id);
                const tieneExc = excTipo !== "";
                return (
                  <li
                    key={c.id}
                    className={`bg-white rounded-xl px-4 py-3 shadow-sm flex flex-col gap-2 ${tieneExc ? "opacity-70" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                        {c.nombre.charAt(0).toUpperCase()}
                      </span>
                      <span className={`text-sm font-medium ${tieneExc ? "line-through text-gray-400" : "text-gray-800"}`}>
                        {c.nombre}
                      </span>
                      {tieneExc ? (
                        <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full border ${EXCEPCION_COLORS[excTipo] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {EXCEPCION_LABELS[excTipo] ?? excTipo}
                        </span>
                      ) : (
                        <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${TURNO_COLORS[roll.turno] ?? ""}`}>
                          {roll.turno}
                        </span>
                      )}
                    </div>

                    {/* Selector de excepción */}
                    <div className="flex items-center gap-2 pl-11">
                      <label
                        htmlFor={`exc-${c.id}`}
                        className="text-xs text-gray-500 shrink-0"
                      >
                        Excepción:
                      </label>
                      <select
                        id={`exc-${c.id}`}
                        value={excTipo}
                        disabled={savingExc[c.id]}
                        onChange={(e) => handleExcepcion(c.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white disabled:opacity-50"
                      >
                        <option value="">Sin excepción</option>
                        <option value="vacaciones">Vacaciones</option>
                        <option value="permiso">Permiso</option>
                        <option value="ausencia">Ausencia</option>
                      </select>
                      {savingExc[c.id] && (
                        <span className="text-xs text-gray-400">Guardando…</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
