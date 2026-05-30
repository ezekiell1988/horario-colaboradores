import Link from "next/link";
import ContactForm from "./components/ContactForm";

const features = [
  {
    icon: "🔄",
    en: "Automatic Shift Rotation",
    es: "Rotación Automática de Turnos",
    descEn: "Weekly rotation calculated automatically. No manual spreadsheets.",
    descEs: "Rotación semanal calculada automáticamente. Sin planillas manuales.",
  },
  {
    icon: "✅",
    en: "Daily Attendance",
    es: "Asistencia Diaria",
    descEn: "Mark attendance in seconds from any mobile device.",
    descEs: "Registra asistencia en segundos desde cualquier celular.",
  },
  {
    icon: "🤖",
    en: "AI-Powered Reports",
    es: "Informes con IA",
    descEn: "Write a draft, AI formalizes it. Export to PDF in one click.",
    descEs: "Escribe un borrador, la IA lo formaliza. Exporta a PDF en un clic.",
  },
  {
    icon: "📱",
    en: "Mobile-First",
    es: "Diseñado para Celular",
    descEn: "Optimized for smartphones. No app installation required.",
    descEs: "Optimizado para smartphones. Sin instalación de app.",
  },
  {
    icon: "👥",
    en: "Role Management",
    es: "Gestión de Roles",
    descEn: "Admins manage everything. Guards see only their schedule.",
    descEs: "Admins gestionan todo. Los oficiales ven solo su turno.",
  },
  {
    icon: "📊",
    en: "Report History",
    es: "Historial de Informes",
    descEn: "All daily reports stored and accessible at any time.",
    descEs: "Todos los informes diarios guardados y accesibles siempre.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-10">
        <span className="font-bold text-xl text-blue-700">Roll Manager</span>
        <div className="flex items-center gap-3">
          <a href="#pricing" className="text-sm text-gray-600 hover:text-blue-700 hidden sm:block">
            Pricing
          </a>
          <Link href="/guia" className="text-sm text-gray-600 hover:text-blue-700 hidden sm:block">
            Guía de usuario
          </Link>
          <Link
            href="/login"
            className="bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
          >
            Login →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="flex flex-col items-center text-center px-6 py-20 bg-gradient-to-b from-blue-50 to-white">
        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-wide">
          Security Workforce · Seguridad Privada
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight max-w-2xl mb-4">
          Shift management{" "}
          <span className="text-blue-700">without the headache</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mb-3">
          Gestión de turnos, asistencia e informes para empresas de seguridad.
          <br />
          <span className="text-gray-400 text-base">Todo en tu celular.</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <a
            href="#contact"
            className="bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors"
          >
            Solicitar demo gratuita
          </a>
          <a
            href="#features"
            className="border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-blue-300 hover:text-blue-700 transition-colors"
          >
            Ver funciones ↓
          </a>
          <Link
            href="/guia"
            className="border border-blue-200 text-blue-700 px-6 py-3 rounded-xl font-semibold hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            📖 Guía de usuario
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2">Everything you need / Todo lo que necesitas</h2>
        <p className="text-center text-gray-400 mb-10 text-sm">Built for rotating security shifts · Construido para turnos rotativos de seguridad</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.en}
              className="border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-blue-100 transition-all"
            >
              <span className="text-3xl mb-3 block">{f.icon}</span>
              <h3 className="font-semibold text-base mb-1">{f.en}</h3>
              <p className="text-xs text-blue-600 font-medium mb-2">{f.es}</p>
              <p className="text-sm text-gray-500">{f.descEn}</p>
              <p className="text-xs text-gray-400 mt-1">{f.descEs}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-gray-50 px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Simple Pricing · Precio Simple</h2>
          <p className="text-gray-400 text-sm mb-10">Per active collaborator · Por colaborador activo</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Monthly */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-left">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Monthly · Mensual</p>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-extrabold text-gray-900">$2.50</span>
                <span className="text-gray-400 mb-1">/ guard / month</span>
              </div>
              <p className="text-xs text-gray-400 mb-6">Minimum $20/month · Mínimo $20/mes</p>
              <ul className="text-sm text-gray-600 space-y-2 mb-8">
                <li>✓ Unlimited shifts · Turnos ilimitados</li>
                <li>✓ Daily attendance · Asistencia diaria</li>
                <li>✓ AI reports · Informes con IA</li>
                <li>✓ PDF export · Exportar PDF</li>
              </ul>
              <a href="#contact" className="block text-center bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors">
                Get started · Comenzar
              </a>
            </div>
            {/* Annual */}
            <div className="bg-blue-700 rounded-2xl p-8 text-left text-white relative overflow-hidden">
              <span className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                SAVE 17% · AHORRA
              </span>
              <p className="text-sm font-semibold text-blue-200 uppercase tracking-wide mb-4">Annual · Anual</p>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-extrabold">$25</span>
                <span className="text-blue-200 mb-1">/ guard / year</span>
              </div>
              <p className="text-xs text-blue-300 mb-6">2 months free · 2 meses gratis</p>
              <ul className="text-sm text-blue-100 space-y-2 mb-8">
                <li>✓ Everything in monthly</li>
                <li>✓ Priority support · Soporte prioritario</li>
                <li>✓ Custom onboarding · Onboarding personalizado</li>
                <li>✓ 2 months free · 2 meses gratis</li>
              </ul>
              <a href="#contact" className="block text-center bg-white text-blue-700 px-4 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors">
                Best value · Mejor valor
              </a>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-6">
            Example: 20 guards = $50/month · Ejemplo: 20 guardas = $50/mes
          </p>
        </div>
      </section>

      {/* CONTACT / DEMO */}
      <section id="contact" className="px-6 py-16 max-w-xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-2">Solicitar demo gratuita</h2>
        <p className="text-gray-400 text-sm mb-8">
          Te mostramos la plataforma en vivo. Sin compromiso.
          <br />
          <span className="text-xs">We'll show you the platform live. No commitment.</span>
        </p>
        <ContactForm />
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 px-6 py-8 text-center text-xs text-gray-400">
        <p className="font-semibold text-gray-600 mb-1">Roll Manager</p>
        <p>Workforce management for security companies · Gestión de personal para empresas de seguridad</p>
        <p className="mt-2 flex justify-center gap-4">
          <Link href="/login" className="text-blue-600 hover:underline">
            Admin Login
          </Link>
          <Link href="/guia" className="text-blue-600 hover:underline">
            Guía de usuario
          </Link>
        </p>
      </footer>
    </div>
  );
}

