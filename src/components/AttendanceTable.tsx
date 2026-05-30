"use client";

type EstadoAsistencia = "presente" | "ausente" | "permiso";

const ESTADO_COLORS: Record<EstadoAsistencia, string> = {
  presente: "bg-green-100 text-green-800",
  ausente: "bg-red-100 text-red-800",
  permiso: "bg-amber-100 text-amber-800",
};

const TURNO_COLORS: Record<string, string> = {
  T1: "bg-blue-100 text-blue-700",
  T2: "bg-amber-100 text-amber-700",
  T3: "bg-purple-100 text-purple-700",
};

export type AsistenciaRow = {
  id: string;
  colaboradorId: string;
  nombre: string;
  grupo: string;
  turno: string;
  puesto: string;
  area: string;
  estado: EstadoAsistencia;
};

type Props = {
  rows: AsistenciaRow[];
  onEstadoChange: (id: string, estado: EstadoAsistencia) => void;
  onPuestoChange: (id: string, puesto: string) => void;
  saving: Record<string, boolean>;
};

export default function AttendanceTable({ rows, onEstadoChange, onPuestoChange, saving }: Props) {
  if (rows.length === 0) {
    return (
      <p className="text-center text-gray-400 py-10">
        No hay colaboradores activos registrados.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
          <tr>
            <th className="px-4 py-3 text-left">Colaborador</th>
            <th className="px-4 py-3 text-left">Grupo</th>
            <th className="px-4 py-3 text-left">Turno</th>
            <th className="px-4 py-3 text-left">Puesto</th>
            <th className="px-4 py-3 text-left">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((row) => (
            <tr key={row.id} className={saving[row.id] ? "opacity-60" : ""}>
              {/* Nombre */}
              <td className="px-4 py-3">
                <p className="font-medium text-gray-800">{row.nombre}</p>
                {row.area && (
                  <span className="inline-block mt-0.5 text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">{row.area}</span>
                )}
              </td>

              {/* Grupo */}
              <td className="px-4 py-3 text-gray-500">{row.grupo}</td>

              {/* Turno */}
              <td className="px-4 py-3">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TURNO_COLORS[row.turno] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {row.turno}
                </span>
              </td>

              {/* Puesto — input editable */}
              <td className="px-4 py-3">
                <input
                  type="text"
                  aria-label={`Puesto de ${row.nombre}`}
                  value={row.puesto}
                  onChange={(e) => onPuestoChange(row.id, e.target.value)}
                  onBlur={(e) => {
                    // guardar al salir del campo
                    onPuestoChange(row.id, e.target.value);
                  }}
                  placeholder="Sin asignar"
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </td>

              {/* Estado — select */}
              <td className="px-4 py-3">
                <select
                  aria-label={`Estado de ${row.nombre}`}
                  value={row.estado}
                  onChange={(e) => onEstadoChange(row.id, e.target.value as EstadoAsistencia)}
                  className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${ESTADO_COLORS[row.estado]}`}
                >
                  <option value="presente">Presente</option>
                  <option value="ausente">Ausente</option>
                  <option value="permiso">Permiso</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
