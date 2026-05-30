"use client";

import { useEffect, useState } from "react";
import { showToast } from "@/lib/toast";
import TourButton from "@/components/TourButton";
import type { DriveStep } from "driver.js";

const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: "Grupos de rotación",
      description: "Los grupos agrupan colaboradores que comparten el mismo ciclo de turnos. Cada grupo tiene su propio punto de inicio de rotación.",
    },
  },
  {
    element: "#grp-btn-nuevo",
    popover: {
      title: "Nuevo grupo",
      description: "Crea un grupo asignando un nombre, el turno con el que comienza y la fecha de inicio de la rotación.",
      side: "bottom",
    },
  },
  {
    element: "#grp-lista",
    popover: {
      title: "Lista de grupos",
      description: "Cada grupo muestra cuántos colaboradores tiene y desde qué turno inicia su rotación. Solo se pueden eliminar grupos sin colaboradores.",
      side: "top",
    },
  },
];

const TURNOS = ["T1 — 06:00–14:00", "T2 — 14:00–22:00", "T3 — 22:00–06:00"];

type Grupo = {
  id: string;
  nombre: string;
  turnoInicioIndex: number;
  fechaInicioRotacion: string;
  _count?: { colaboradores: number };
};
type FormState = {
  nombre: string;
  turnoInicioIndex: number;
  fechaInicioRotacion: string;
};

const EMPTY_FORM: FormState = { nombre: "", turnoInicioIndex: 0, fechaInicioRotacion: "" };

export default function GruposPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      const res = await fetch("/api/grupos");
      if (!res.ok) throw new Error();
      setGrupos(await res.json());
    } catch {
      showToast("Error al cargar los grupos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openNew() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  }

  function openEdit(g: Grupo) {
    setEditId(g.id);
    setForm({
      nombre: g.nombre,
      turnoInicioIndex: g.turnoInicioIndex,
      fechaInicioRotacion: g.fechaInicioRotacion.split("T")[0],
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const url = editId ? `/api/grupos/${editId}` : "/api/grupos";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar");
      return;
    }

    setShowModal(false);
    await loadData();
  }

  async function handleDelete(g: Grupo) {
    if (!confirm(`¿Eliminar el grupo "${g.nombre}"?`)) return;

    const res = await fetch(`/api/grupos/${g.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Error al eliminar");
      return;
    }
    await loadData();
  }

  if (loading) {
    return <p className="text-center text-gray-500 py-12">Cargando...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Grupos de rotación</h1>
        <div className="flex items-center gap-2">
          <TourButton steps={TOUR_STEPS} label="Tour de esta pantalla" />
          <button
            id="grp-btn-nuevo"
            onClick={openNew}
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Nuevo
          </button>
        </div>
      </div>

      {grupos.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No hay grupos registrados.</p>
      ) : (
        <ul id="grp-lista" className="space-y-2">
          {grupos.map((g) => (
            <li key={g.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-800">{g.nombre}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Inicia en {TURNOS[g.turnoInicioIndex]} · desde{" "}
                    {new Date(g.fechaInicioRotacion).toLocaleDateString("es-CR")}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {g._count?.colaboradores ?? 0} colaboradores
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(g)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Editar
                  </button>
                  {(g._count?.colaboradores ?? 0) === 0 && (
                    <button
                      onClick={() => handleDelete(g)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editId ? "Editar grupo" : "Nuevo grupo"}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="grp-nombre"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nombre del grupo
                </label>
                <input
                  id="grp-nombre"
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="grp-turno"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Turno de inicio del ciclo
                </label>
                <select
                  id="grp-turno"
                  value={form.turnoInicioIndex}
                  onChange={(e) =>
                    setForm({ ...form, turnoInicioIndex: Number(e.target.value) })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TURNOS.map((t, i) => (
                    <option key={i} value={i}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="grp-fecha"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fecha de inicio de rotación (lunes)
                </label>
                <input
                  id="grp-fecha"
                  type="date"
                  required
                  value={form.fechaInicioRotacion}
                  onChange={(e) =>
                    setForm({ ...form, fechaInicioRotacion: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
