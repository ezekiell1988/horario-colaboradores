"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  informeId: string;
  initialTitulo: string;
  initialContenido: string;
  initialTextoFormal: string | null;
  onSaved?: () => void;
}

export default function ReportEditor({
  informeId,
  initialTitulo,
  initialContenido,
  initialTextoFormal,
  onSaved,
}: Props) {
  const [titulo, setTitulo] = useState(initialTitulo);
  const [contenido, setContenido] = useState(initialContenido);
  const [textoFormal, setTextoFormal] = useState(initialTextoFormal ?? "");
  const [saving, setSaving] = useState(false);
  const [formalizing, setFormalizing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autoguardado: contenido y titulo con debounce 2 s
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save({ titulo, contenido }), 2000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titulo, contenido]);

  async function save(data: { titulo?: string; contenido?: string; textoFormal?: string }) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/informes/${informeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setLastSaved(new Date());
      onSaved?.();
    } catch {
      setError("Error al guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFormalizar() {
    if (!contenido.trim()) return;
    setFormalizing(true);
    setError(null);
    try {
      const res = await fetch("/api/informes/formalizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ borrador: contenido }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error ?? "Error al formalizar");
      }
      const json = (await res.json()) as { textoFormal: string };
      setTextoFormal(json.textoFormal);
      await save({ textoFormal: json.textoFormal });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al formalizar");
    } finally {
      setFormalizing(false);
    }
  }

  async function handleGuardarFormal() {
    await save({ textoFormal });
  }

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <label htmlFor="titulo-informe" className="block text-sm font-medium text-gray-700 mb-1">
          Título
        </label>
        <input
          id="titulo-informe"
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Título del informe"
        />
      </div>

      {/* Borrador */}
      <div>
        <label htmlFor="contenido-informe" className="block text-sm font-medium text-gray-700 mb-1">
          Borrador
        </label>
        <textarea
          id="contenido-informe"
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          rows={10}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          placeholder="Escribe el borrador del informe…"
        />
      </div>

      {/* Controles */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleFormalizar}
          disabled={formalizing || !contenido.trim()}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {formalizing ? "Formalizando…" : "✦ Formalizar con IA"}
        </button>

        <a
          href={`/api/informes/${informeId}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 transition-colors inline-block"
        >
          ↓ Exportar PDF
        </a>

        <span className="text-xs text-gray-400 ml-auto">
          {saving
            ? "Guardando…"
            : lastSaved
            ? `Guardado ${lastSaved.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" })}`
            : "Sin cambios guardados"}
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Texto formalizado */}
      {textoFormal && (
        <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50 space-y-3">
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
            Texto formalizado por IA
          </p>
          <label htmlFor="texto-formal" className="sr-only">
            Texto formalizado
          </label>
          <textarea
            id="texto-formal"
            value={textoFormal}
            onChange={(e) => setTextoFormal(e.target.value)}
            rows={10}
            className="w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm leading-relaxed bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
          <button
            type="button"
            onClick={handleGuardarFormal}
            disabled={saving}
            className="px-4 py-2 bg-indigo-100 text-indigo-800 text-sm rounded-lg font-medium hover:bg-indigo-200 disabled:opacity-50 transition-colors"
          >
            Guardar texto formal
          </button>
        </div>
      )}
    </div>
  );
}
