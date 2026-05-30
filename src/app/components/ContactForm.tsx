"use client";

export default function ContactForm() {
  return (
    <form
      className="flex flex-col gap-4 text-left"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const mailto = `mailto:contacto@ezekl.com?subject=Demo Roll Manager&body=Empresa: ${data.get("empresa")}%0AContacto: ${data.get("nombre")}%0ATel%C3%A9fono: ${data.get("telefono")}%0AColaboradores: ${data.get("colaboradores")}`;
        window.location.href = mailto;
      }}
    >
      <div>
        <label htmlFor="empresa" className="text-sm font-medium text-gray-700 block mb-1">
          Empresa / Company *
        </label>
        <input
          id="empresa"
          name="empresa"
          type="text"
          required
          placeholder="Allied Universal, G4S..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
      <div>
        <label htmlFor="nombre" className="text-sm font-medium text-gray-700 block mb-1">
          Nombre / Name *
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          placeholder="Tu nombre"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
      <div>
        <label htmlFor="telefono" className="text-sm font-medium text-gray-700 block mb-1">
          WhatsApp / Teléfono *
        </label>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          required
          placeholder="+502 ..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>
      <div>
        <label htmlFor="colaboradores" className="text-sm font-medium text-gray-700 block mb-1">
          ¿Cuántos colaboradores? / How many guards?
        </label>
        <select
          id="colaboradores"
          name="colaboradores"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        >
          <option value="1-10">1 – 10</option>
          <option value="11-25">11 – 25</option>
          <option value="26-50">26 – 50</option>
          <option value="50+">50+</option>
        </select>
      </div>
      <button
        type="submit"
        className="bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors mt-2"
      >
        Enviar solicitud →
      </button>
    </form>
  );
}
