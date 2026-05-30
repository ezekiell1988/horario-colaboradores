"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AttendanceTable, { AsistenciaRow } from "@/components/AttendanceTable";
import { showToast } from "@/lib/toast";

function getTodayISO(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function shiftDay(fecha: string, days: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function formatFecha(fecha: string): string {
  return new Date(`${fecha}T00:00:00Z`).toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function AsistenciaPage() {
  const [fecha, setFecha] = useState(getTodayISO());
  const [rows, setRows] = useState<AsistenciaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // debounce timers para el campo puesto
  const puestoTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const fetchAsistencia = useCallback((f: string) => {
    setLoading(true);
    fetch(`/api/asistencia?fecha=${f}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: AsistenciaRow[]) => setRows(data))
      .catch(() => showToast("Error al cargar la asistencia"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAsistencia(fecha);
  }, [fecha, fetchAsistencia]);

  const saveField = useCallback(async (id: string, patch: { estado?: string; puesto?: string }) => {
    setSaving((s) => ({ ...s, [id]: true }));
    try {
      const res = await fetch(`/api/asistencia/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) showToast("Error al guardar el cambio");
    } catch {
      showToast("Sin conexión — cambio no guardado");
    } finally {
      setSaving((s) => ({ ...s, [id]: false }));
    }
  }, []);

  const handleEstadoChange = useCallback(
    (id: string, estado: "presente" | "ausente" | "permiso") => {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, estado } : r)));
      saveField(id, { estado });
    },
    [saveField],
  );

  const handlePuestoChange = useCallback(
    (id: string, puesto: string) => {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, puesto } : r)));
      // debounce 800 ms
      clearTimeout(puestoTimers.current[id]);
      puestoTimers.current[id] = setTimeout(() => {
        saveField(id, { puesto });
      }, 800);
    },
    [saveField],
  );

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">Asistencia diaria</h1>

      {/* Selector de fecha */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFecha((f) => shiftDay(f, -1))}
            aria-label="Día anterior"
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600"
          >
            ‹
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-gray-800 capitalize">{formatFecha(fecha)}</p>
          </div>
          <button
            onClick={() => setFecha((f) => shiftDay(f, 1))}
            aria-label="Día siguiente"
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600"
          >
            ›
          </button>
        </div>
        <div className="text-center mt-1">
          <button
            onClick={() => setFecha(getTodayISO())}
            className="text-xs text-blue-600 hover:underline"
          >
            Ir a hoy
          </button>
        </div>
      </div>

      {/* Resumen */}
      {!loading && rows.length > 0 && (
        <div className="flex gap-3 mb-4 text-sm">
          {(["presente", "ausente", "permiso"] as const).map((e) => {
            const count = rows.filter((r) => r.estado === e).length;
            const colors = {
              presente: "bg-green-50 text-green-700 border-green-200",
              ausente: "bg-red-50 text-red-700 border-red-200",
              permiso: "bg-amber-50 text-amber-700 border-amber-200",
            };
            return (
              <div
                key={e}
                className={`flex-1 rounded-xl border px-3 py-2 text-center ${colors[e]}`}
              >
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs capitalize">{e}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <p className="text-center text-gray-400 py-10">Cargando asistencia...</p>
      ) : (
        <AttendanceTable
          rows={rows}
          onEstadoChange={handleEstadoChange}
          onPuestoChange={handlePuestoChange}
          saving={saving}
        />
      )}
    </div>
  );
}
