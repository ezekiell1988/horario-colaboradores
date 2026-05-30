"use client";

import { useEffect, useState } from "react";
import { showToast } from "@/lib/toast";

type Grupo = { id: string; nombre: string };
type Colaborador = {
  id: string;
  nombre: string;
  puesto: string | null;
  modalidad: string;
  turnoFijo: string | null;
  activo: boolean;
  grupoId: string;
  grupo: Grupo;
};
type FormState = { nombre: string; grupoId: string; activo: boolean; puesto: string; modalidad: string; turnoFijo: string };

const EMPTY_FORM: FormState = { nombre: "", grupoId: "", activo: true, puesto: "", modalidad: "FULL", turnoFijo: "" };

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      const [colRes, grpRes] = await Promise.all([
        fetch("/api/colaboradores"),
        fetch("/api/grupos"),
      ]);
      if (!colRes.ok || !grpRes.ok) throw new Error();
      const [cols, grps] = await Promise.all([colRes.json(), grpRes.json()]);
      setColaboradores(cols);
      setGrupos(grps);
    } catch {
      showToast("Error al cargar los datos");
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

  function openEdit(c: Colaborador) {
    setEditId(c.id);
    setForm({ nombre: c.nombre, grupoId: c.grupoId, activo: c.activo, puesto: c.puesto ?? "", modalidad: c.modalidad ?? "FULL", turnoFijo: c.turnoFijo ?? "" });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const url = editId ? `/api/colaboradores/${editId}` : "/api/colaboradores";
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

  async function toggleActivo(c: Colaborador) {
    try {
      const res = await fetch(`/api/colaboradores/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: c.nombre, grupoId: c.grupoId, activo: !c.activo, puesto: c.puesto, modalidad: c.modalidad, turnoFijo: c.turnoFijo }),
      });
      if (!res.ok) throw new Error();
      await loadData();
    } catch {
      showToast("Error al actualizar el colaborador");
    }
  }

  if (loading) {
    return <p className="text-center text-gray-500 py-12">Cargando...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Colaboradores</h1>
        <button
          onClick={openNew}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nuevo
        </button>
      </div>

      {colaboradores.length === 0 ? (
        <p className="text-center text-gray-400 py-12">
          No hay colaboradores registrados.
        </p>
      ) : (
        <ul className="space-y-2">
          {colaboradores.map((c) => (
            <li
              key={c.id}
              className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p
                  className={`font-medium truncate ${c.activo ? "text-gray-800" : "text-gray-400 line-through"}`}
                >
                  {c.nombre}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {c.grupo?.nombre ?? "—"}{c.puesto ? ` · ${c.puesto}` : ""}
                  {" · "}
                  <span className={`font-medium ${
                    c.modalidad === "FIJO" ? "text-purple-600" :
                    c.modalidad === "MT" ? "text-orange-600" :
                    "text-blue-600"
                  }`}>
                    {c.modalidad === "FULL" ? "Mixto" : c.modalidad === "MT" ? "Doble" : `Fijo ${c.turnoFijo ?? ""}`}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActivo(c)}
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    c.activo
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {c.activo ? "Activo" : "Inactivo"}
                </button>
                <button
                  onClick={() => openEdit(c)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Editar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editId ? "Editar colaborador" : "Nuevo colaborador"}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="col-nombre"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nombre
                </label>
                <input
                  id="col-nombre"
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="col-grupoId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Grupo
                </label>
                <select
                  id="col-grupoId"
                  required
                  value={form.grupoId}
                  onChange={(e) => setForm({ ...form, grupoId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar grupo...</option>
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="col-puesto"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Puesto <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  id="col-puesto"
                  type="text"
                  placeholder="Charlie 1, Coordinador..."
                  value={form.puesto}
                  onChange={(e) => setForm({ ...form, puesto: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="col-modalidad"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Modalidad
                </label>
                <select
                  id="col-modalidad"
                  value={form.modalidad}
                  onChange={(e) => setForm({ ...form, modalidad: e.target.value, turnoFijo: "" })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FULL">Turno mixto (Mañana + Tarde + Noche)</option>
                  <option value="MT">Turno doble (Mañana + Tarde)</option>
                  <option value="FIJO">Turno fijo</option>
                </select>
              </div>
              {form.modalidad === "FIJO" && (
                <div>
                  <label
                    htmlFor="col-turnoFijo"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Turno fijo
                  </label>
                  <select
                    id="col-turnoFijo"
                    required
                    value={form.turnoFijo}
                    onChange={(e) => setForm({ ...form, turnoFijo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar turno...</option>
                    <option value="T1">Mañana (06:00–14:00)</option>
                    <option value="T2">Tarde (14:00–22:00)</option>
                  </select>
                </div>
              )}
              {editId && (
                <div className="flex items-center gap-2">
                  <input
                    id="col-activo"
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="col-activo" className="text-sm font-medium text-gray-700">
                    Activo
                  </label>
                </div>
              )}
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
