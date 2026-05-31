"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AttendanceTable, { AsistenciaRow } from "@/components/AttendanceTable";
import { showToast } from "@/lib/toast";
import TourButton from "@/components/TourButton";
import type { DriveStep } from "driver.js";

const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: "Asistencia diaria",
      description: "Registra la asistencia de todos los colaboradores día a día. Los cambios se guardan automáticamente.",
    },
  },
  {
    element: "#asistencia-nav",
    popover: {
      title: "Navegación de fechas",
      description: "Usa las flechas para moverte entre días o el botón \"Ir a hoy\" para volver rápido al día actual.",
      side: "bottom",
    },
  },
  {
    element: "#asistencia-resumen",
    popover: {
      title: "Resumen del día",
      description: "Conteo de presentes, ausentes y con permiso del día seleccionado.",
      side: "bottom",
    },
  },
  {
    element: "#asistencia-tabla",
    popover: {
      title: "Tabla de asistencia",
      description: "Toca el estado (presente / ausente / permiso) para cambiarlo al instante. El campo \"puesto\" se guarda automáticamente al dejar de escribir.",
      side: "top",
    },
  },
];

function getTodayISO(): string {
  // Usar timezone de Costa Rica (GMT-6) en lugar de UTC del servidor
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Costa_Rica" }).format(new Date());
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
  const [filtroArea, setFiltroArea] = useState<string>("");

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

  const areas = Array.from(new Set(rows.map((r) => r.area).filter(Boolean))).sort();
  const rowsFiltrados = filtroArea ? rows.filter((r) => r.area === filtroArea) : rows;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Asistencia diaria</h1>
        <TourButton steps={TOUR_STEPS} label="Tour de esta pantalla" />
      </div>

      {/* Selector de fecha */}
      <div id="asistencia-nav" className="bg-white rounded-xl p-4 shadow-sm mb-4">
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
        <div id="asistencia-resumen" className="flex gap-3 mb-4 text-sm">
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

      {/* Filtro por área */}
      {!loading && areas.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFiltroArea("")}
            className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
              filtroArea === ""
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Todos
          </button>
          {areas.map((a) => (
            <button
              key={a}
              onClick={() => setFiltroArea(a)}
              className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                filtroArea === a
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <p className="text-center text-gray-400 py-10">Cargando asistencia...</p>
      ) : (
        <div id="asistencia-tabla">
          <AttendanceTable
            rows={rowsFiltrados}
            onEstadoChange={handleEstadoChange}
            onPuestoChange={handlePuestoChange}
            saving={saving}
          />
        </div>
      )}
    </div>
  );
}
