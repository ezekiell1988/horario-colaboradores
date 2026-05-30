"use client";

import { useCallback, useEffect, useState } from "react";
import { showToast } from "@/lib/toast";
import TourButton from "@/components/TourButton";
import type { DriveStep } from "driver.js";

const TOUR_STEPS: DriveStep[] = [
  {
    popover: {
      title: "Gestión de Usuarios",
      description: "Aquí creas y eliminas cuentas de acceso. Los roles disponibles son Admin, Coordinador y Oficial.",
    },
  },
  {
    element: "#usuarios-btn-nuevo",
    popover: {
      title: "Nuevo usuario",
      description: "Abre el formulario para crear un usuario con email, contraseña y rol.",
      side: "bottom",
    },
  },
  {
    element: "#usuarios-lista",
    popover: {
      title: "Lista de usuarios",
      description: "Cada fila muestra el email, el colaborador vinculado (si aplica) y el rol asignado. Solo los administradores pueden eliminar usuarios.",
      side: "top",
    },
  },
];

type Usuario = {
  id: string;
  email: string;
  rol: string;
  colaboradorId: string | null;
  colaborador: { nombre: string } | null;
};

const ROL_COLORS: Record<string, string> = {
  admin: "bg-blue-100 text-blue-700",
  coordinador: "bg-teal-100 text-teal-700",
  oficial: "bg-purple-100 text-purple-700",
};

const ROL_LABELS: Record<string, string> = {
  admin: "Admin",
  coordinador: "Coordinador",
  oficial: "Oficial",
};

type FormState = {
  email: string;
  password: string;
  rol: string;
};

const FORM_INICIAL: FormState = { email: "", password: "", rol: "coordinador" };

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setLoading(true);
    fetch("/api/usuarios")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<Usuario[]>;
      })
      .then(setUsuarios)
      .catch(() => showToast("Error al cargar usuarios"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      showToast("Email y contraseña son obligatorios");
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Error al crear usuario");
        return;
      }
      showToast("Usuario creado correctamente");
      setForm(FORM_INICIAL);
      setMostrarForm(false);
      cargar();
    } catch {
      showToast("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string, email: string) => {
    if (!confirm(`¿Eliminar al usuario ${email}? Esta acción no se puede deshacer.`)) return;
    setEliminando(id);
    try {
      const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Error al eliminar");
        return;
      }
      showToast("Usuario eliminado");
      cargar();
    } catch {
      showToast("Error de conexión");
    } finally {
      setEliminando(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Usuarios</h1>
        <div className="flex items-center gap-2">
          <TourButton steps={TOUR_STEPS} label="Tour de esta pantalla" />
          <button
            id="usuarios-btn-nuevo"
            onClick={() => { setMostrarForm((v) => !v); setForm(FORM_INICIAL); }}
            className="px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {mostrarForm ? "Cancelar" : "Nuevo usuario"}
          </button>
        </div>
      </div>

      {/* Formulario de creación */}
      {mostrarForm && (
        <form
          onSubmit={handleCrear}
          className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-gray-700">Nuevo usuario</h2>

          <div>
            <label htmlFor="nu-email" className="block text-xs font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              id="nu-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="usuario@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="nu-password" className="block text-xs font-medium text-gray-600 mb-1">
              Contraseña
            </label>
            <input
              id="nu-password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mínimo 8 caracteres"
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="nu-rol" className="block text-xs font-medium text-gray-600 mb-1">
              Rol
            </label>
            <select
              id="nu-rol"
              value={form.rol}
              onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="coordinador">Coordinador</option>
              <option value="admin">Admin</option>
              <option value="oficial">Oficial</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="w-full py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {guardando ? "Guardando…" : "Crear usuario"}
          </button>
        </form>
      )}

      {/* Lista de usuarios */}
      {loading ? (
        <p className="text-center text-gray-400 py-10">Cargando usuarios...</p>
      ) : usuarios.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No hay usuarios registrados.</p>
      ) : (
        <div id="usuarios-lista" className="space-y-2">
          {usuarios.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-3 shadow-sm"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{u.email}</p>
                {u.colaborador && (
                  <p className="text-xs text-gray-400 truncate">{u.colaborador.nombre}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    ROL_COLORS[u.rol] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {ROL_LABELS[u.rol] ?? u.rol}
                </span>
                <button
                  onClick={() => handleEliminar(u.id, u.email)}
                  disabled={eliminando === u.id}
                  aria-label={`Eliminar usuario ${u.email}`}
                  className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                >
                  {eliminando === u.id ? "…" : "Eliminar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
