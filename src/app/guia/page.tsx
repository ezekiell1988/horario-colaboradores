import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guía de usuario · Roll Manager",
  description:
    "Guía completa para administradores, coordinadores y oficiales del sistema de gestión de turnos Roll Manager.",
};

export default function GuiaPage() {
  return (
    <>
      <style>{`
        :root {
          --blue:#3b82f6; --blue-l:#eff6ff;
          --green:#22c55e; --green-l:#f0fdf4;
          --amber:#f59e0b; --amber-l:#fffbeb;
          --red:#ef4444;   --red-l:#fef2f2;
          --indigo:#6366f1;--indigo-l:#eef2ff;
          --purple:#8b5cf6;--purple-l:#f5f3ff;
          --border:#e5e7eb;
          --radius:12px;
          --shadow:0 2px 12px rgba(0,0,0,.07);
        }
        .g-body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:#f8fafc; color:#1f2937; min-height:100vh; }
        .g-hero { background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%); color:#fff; padding:52px 24px 44px; text-align:center; }
        .g-hero .badge { display:inline-block; background:rgba(255,255,255,.18); border-radius:999px; padding:4px 14px; font-size:.78rem; font-weight:600; letter-spacing:.05em; margin-bottom:14px; }
        .g-hero h1 { font-size:2rem; font-weight:800; margin:0 0 10px; }
        .g-hero p  { font-size:.97rem; opacity:.88; margin:0; max-width:520px; margin:0 auto; }
        .g-hero .url { font-size:.82rem; margin-top:14px; opacity:.7; letter-spacing:.03em; }
        .g-container { max-width:860px; margin:0 auto; padding:0 16px 60px; }

        /* TOC */
        .toc { background:#fff; border-radius:var(--radius); box-shadow:var(--shadow); margin-top:28px; padding:20px 24px; }
        .toc h2 { font-size:.95rem; font-weight:700; margin:0 0 12px; color:#374151; }
        .toc ol { padding-left:20px; font-size:.88rem; line-height:1.9; margin:0; }
        .toc a  { color:var(--blue); text-decoration:none; }
        .toc a:hover { text-decoration:underline; }

        /* Section */
        .section { border-radius:var(--radius); box-shadow:var(--shadow); overflow:hidden; margin-top:24px; background:#fff; }
        .section-header { display:flex; gap:14px; align-items:flex-start; padding:18px 20px 14px; border-bottom:1px solid var(--border); }
        .section-header .icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.15rem; flex-shrink:0; }
        .section-header h2 { font-size:1.05rem; font-weight:700; margin:0 0 3px; }
        .section-header p  { font-size:.82rem; color:#6b7280; margin:0; }
        .section-body { padding:20px; }
        .blue  .section-header { background:var(--blue-l);   border-color:#bfdbfe; }
        .blue  .icon            { background:var(--blue);    color:#fff; }
        .green .section-header  { background:var(--green-l); border-color:#bbf7d0; }
        .green .icon            { background:var(--green);   color:#fff; }
        .amber .section-header  { background:var(--amber-l); border-color:#fde68a; }
        .amber .icon            { background:var(--amber);   color:#fff; }
        .red   .section-header  { background:var(--red-l);   border-color:#fecaca; }
        .red   .icon            { background:var(--red);     color:#fff; }
        .indigo .section-header { background:var(--indigo-l);border-color:#c7d2fe; }
        .indigo .icon           { background:var(--indigo);  color:#fff; }
        .purple .section-header { background:var(--purple-l);border-color:#ddd6fe; }
        .purple .icon           { background:var(--purple);  color:#fff; }

        /* Steps */
        .steps { list-style:none; counter-reset:step; padding:0; margin:0; }
        .steps li { counter-increment:step; display:flex; gap:14px; padding:14px 0; border-bottom:1px solid var(--border); }
        .steps li:last-child { border-bottom:none; }
        .steps li::before { content:counter(step); min-width:32px; height:32px; border-radius:50%; background:var(--blue); color:#fff; font-weight:700; font-size:.85rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; }
        .steps .step-title { font-weight:600; margin-bottom:4px; }
        .steps .step-desc  { font-size:.88rem; color:#6b7280; }

        /* Table */
        .tbl-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch; }
        table { width:100%; border-collapse:collapse; font-size:.88rem; }
        th { background:#f1f5f9; text-align:left; padding:9px 14px; font-weight:600; border-bottom:2px solid var(--border); }
        td { padding:9px 14px; border-bottom:1px solid var(--border); vertical-align:top; }
        tr:last-child td { border-bottom:none; }
        tr:hover td { background:#f9fafb; }

        /* Callout */
        .callout { border-radius:8px; padding:14px 16px; margin:16px 0; font-size:.88rem; display:flex; gap:10px; align-items:flex-start; }
        .callout .ci { font-size:1.1rem; line-height:1.4; flex-shrink:0; }
        .callout.warn  { background:var(--amber-l); border-left:4px solid #f59e0b; }
        .callout.info  { background:var(--blue-l);  border-left:4px solid #60a5fa; }
        .callout.ok    { background:var(--green-l); border-left:4px solid #4ade80; }
        .callout.error { background:var(--red-l);   border-left:4px solid #f87171; }

        /* Badges */
        .pill { display:inline-block; border-radius:999px; padding:2px 10px; font-size:.75rem; font-weight:600; }
        .pill-blue   { background:#dbeafe; color:#1d4ed8; }
        .pill-green  { background:#dcfce7; color:#15803d; }
        .pill-amber  { background:#fef3c7; color:#b45309; }
        .pill-red    { background:#fee2e2; color:#dc2626; }
        .pill-gray   { background:#f3f4f6; color:#374151; }
        .pill-indigo { background:#e0e7ff; color:#4338ca; }
        .pill-sky    { background:#e0f2fe; color:#0369a1; }
        .pill-purple { background:#f3e8ff; color:#7c3aed; }

        /* Turn cards */
        .turn-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:12px; margin:16px 0; }
        .turn-card  { border-radius:10px; padding:16px; border:1px solid var(--border); }
        .turn-card .t-label { font-weight:700; font-size:.85rem; margin-bottom:4px; }
        .turn-card .t-time  { font-size:1rem; font-weight:600; }
        .turn-card .t-note  { font-size:.75rem; margin-top:6px; opacity:.75; }
        .t1 { background:#f0f9ff; border-color:#bae6fd; }
        .t1 .t-label { color:#0369a1; }
        .t2 { background:#fffbeb; border-color:#fde68a; }
        .t2 .t-label { color:#b45309; }
        .t3 { background:#f5f3ff; border-color:#ddd6fe; }
        .t3 .t-label { color:#6d28d9; }
        .tl { background:#f0fdf4; border-color:#bbf7d0; }
        .tl .t-label { color:#15803d; }

        /* Flow */
        .flow { display:flex; flex-wrap:wrap; gap:0; align-items:center; margin:16px 0; }
        .flow-item  { background:var(--blue); color:#fff; border-radius:8px; padding:10px 16px; font-size:.85rem; font-weight:600; text-align:center; flex:1; min-width:100px; }
        .flow-arrow { color:#94a3b8; font-size:1.3rem; padding:0 6px; }

        /* Role cards */
        .role-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:14px; margin:8px 0; }
        .role-card  { border-radius:10px; padding:18px; border:1px solid var(--border); }
        .role-card h3 { font-size:.95rem; font-weight:700; margin:0 0 8px; }
        .role-card ul { padding-left:18px; font-size:.85rem; line-height:1.7; margin:0; }

        /* Separator */
        .sep { border:none; border-top:1px solid var(--border); margin:18px 0; }

        /* Helpers */
        .mt8  { margin-top:8px; }
        .mt14 { margin-top:14px; }
        .mt18 { margin-top:18px; }
        b  { font-weight:600; }
        code { background:#f1f5f9; border:1px solid #e2e8f0; border-radius:4px; padding:1px 6px; font-size:.82rem; font-family:"SF Mono","Fira Code",monospace; }

        /* Week pattern table */
        .week-table th { background:#f8fafc; text-align:center; }
        .week-table td { text-align:center; }
        .day-t1  { background:#eff6ff; color:#1d4ed8; font-weight:600; border-radius:4px; padding:3px 8px; font-size:.8rem; display:inline-block; }
        .day-t2  { background:#fffbeb; color:#b45309; font-weight:600; border-radius:4px; padding:3px 8px; font-size:.8rem; display:inline-block; }
        .day-lib { background:#f0fdf4; color:#15803d; font-weight:600; border-radius:4px; padding:3px 8px; font-size:.8rem; display:inline-block; }

        /* FAQ */
        .faq-item { border:1px solid var(--border); border-radius:8px; padding:14px 16px; margin-bottom:10px; }
        .faq-item .faq-q { font-weight:600; font-size:.93rem; margin-bottom:6px; color:#1e3a5f; }
        .faq-item .faq-a { font-size:.88rem; color:#4b5563; }

        /* Role card color accents */
        .role-admin   { border-top:3px solid #dc2626; }
        .role-coord   { border-top:3px solid #1d4ed8; }
        .role-oficial { border-top:3px solid #15803d; }

        /* Text utilities */
        .g-sm        { font-size:.88rem; }
        .g-xs-muted  { font-size:.8rem; color:#6b7280; }

        /* Nested list inside step-desc */
        .g-list  { margin-top:6px; padding-left:18px; font-size:.85rem; line-height:1.8; }
        .g-list-h{ margin-top:6px; padding-left:18px; font-size:.85rem; line-height:1.9; }

        /* TOC nested ol */
        .toc-sub { padding-left:18px; margin-top:2px; margin-bottom:0; }

        /* Table row highlight */
        .row-purple { background:#faf5ff; }

        /* Purple accent text */
        .c-purple { color:#7c3aed; }

        /* Flow with wrap */
        .flow-wrap { flex-wrap:wrap !important; gap:8px !important; }

        /* Flow item color overrides */
        .fi-1 { background:#6d28d9 !important; }
        .fi-2 { background:#1d4ed8 !important; }
        .fi-3 { background:#0369a1 !important; }
        .fi-4 { background:#15803d !important; }
        .fi-5 { background:#b45309 !important; }

        /* Guide footer */
        .g-footer { text-align:center; margin-top:40px; font-size:.78rem; color:#9ca3af; padding-bottom:20px; }

        @media (max-width:600px) {
          .g-hero { padding:36px 16px 32px; }
          .g-hero h1 { font-size:1.5rem; }
          .section-body { padding:14px; }
          .section-header { padding:14px 16px 12px; }
          .flow-item { min-width:80px; font-size:.78rem; }
        }
      `}</style>

      <div className="g-body">

        {/* NAV */}
        <nav className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
          <Link href="/" className="font-bold text-blue-700 text-sm flex items-center gap-1">
            ← Roll Manager
          </Link>
          <span className="text-xs text-gray-400">Guía de usuario</span>
        </nav>

        {/* HERO */}
        <div className="g-hero">
          <div className="badge">Guía de usuario · Roll Manager</div>
          <h1>🛡️ Roll Manager</h1>
          <p>Sistema de gestión de turnos rotativos, asistencia e informes para equipos de seguridad.</p>
          <div className="url">https://roll-manager.ezekl.com</div>
        </div>

        <div className="g-container">

          {/* TOC */}
          <nav className="toc" aria-label="Tabla de contenidos">
            <h2>📋 Contenido de esta guía</h2>
            <ol>
              <li><a href="#que-es">¿Qué es Roll Manager y para qué sirve?</a></li>
              <li><a href="#roles">Roles y accesos</a></li>
              <li><a href="#conceptos">Conceptos clave</a>
                <ol className="toc-sub">
                  <li><a href="#turnos">Los 3 turnos</a></li>
                  <li><a href="#rotacion">Rotación semanal</a></li>
                  <li><a href="#grupos">Grupos</a></li>
                  <li><a href="#modalidades">Modalidades de colaborador</a></li>
                  <li><a href="#mt-alterno">Modalidad MT_ALTERNO — detalle completo</a></li>
                  <li><a href="#dias-libres">Días libres configurables</a></li>
                  <li><a href="#excepciones">Excepciones de la semana</a></li>
                </ol>
              </li>
              <li><a href="#orden">Orden correcto de configuración</a></li>
              <li><a href="#flujos">Uso diario del sistema</a></li>
              <li><a href="#oficial-view">Vista del oficial</a></li>
              <li><a href="#errores">Errores comunes y cómo evitarlos</a></li>
              <li><a href="#faq">Preguntas frecuentes</a></li>
            </ol>
          </nav>

          {/* ══════════════════════════════════════
               1 · QUÉ ES
          ══════════════════════════════════════ */}
          <section className="section blue" id="que-es">
            <div className="section-header">
              <div className="icon">🎯</div>
              <div>
                <h2>¿Qué es Roll Manager y para qué sirve?</h2>
                <p>Alcance y finalidad del sistema</p>
              </div>
            </div>
            <div className="section-body">
              <p><b>Roll Manager</b> es una aplicación web diseñada para gestionar el personal de seguridad de <b>An Allied Universal Company</b>. Resuelve tres problemas concretos del día a día:</p>
              <div className="turn-cards mt14">
                <div className="turn-card t1">
                  <div className="t-label">📅 Problema 1 — Turnos</div>
                  <div className="t-time">¿Quién trabaja esta semana y en qué turno?</div>
                  <div className="t-note">El sistema calcula automáticamente la rotación semanal de cada colaborador. Ya no hay que hacerlo a mano.</div>
                </div>
                <div className="turn-card t2">
                  <div className="t-label">✅ Problema 2 — Asistencia</div>
                  <div className="t-time">¿Quién llegó, quién faltó, quién tiene permiso?</div>
                  <div className="t-note">Registro digital diario por colaborador. Queda guardado y es consultable en cualquier momento.</div>
                </div>
                <div className="turn-card t3">
                  <div className="t-label">📄 Problema 3 — Informes</div>
                  <div className="t-time">¿Cómo genero el informe diario formal?</div>
                  <div className="t-note">El admin escribe el borrador, la IA lo formaliza, y se exporta a PDF para compartir por WhatsApp.</div>
                </div>
              </div>
              <hr className="sep" />
              <p><b>¿A quién está dirigido?</b> A coordinadores y administradores de seguridad que manejan grupos de oficiales con turnos rotativos de 8 horas.</p>
              <div className="callout info mt8">
                <span className="ci">📱</span>
                <div>La app está optimizada para usarse desde el <b>navegador del celular</b>. No se instala nada — solo abres el link y ya.</div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════
               2 · ROLES
          ══════════════════════════════════════ */}
          <section className="section green" id="roles">
            <div className="section-header">
              <div className="icon">👤</div>
              <div>
                <h2>Roles y accesos</h2>
                <p>Quién puede hacer qué en el sistema</p>
              </div>
            </div>
            <div className="section-body">
              <div className="role-cards">
                <div className="role-card role-admin">
                  <h3>🔴 Administrador <span className="pill pill-red">admin</span></h3>
                  <ul>
                    <li>Crear y editar grupos</li>
                    <li>Crear y editar colaboradores (todos los campos)</li>
                    <li>Ver el roll semanal de cualquier grupo</li>
                    <li>Registrar asistencia diaria</li>
                    <li>Crear y editar informes</li>
                    <li>Formalizar informes con IA y exportar PDF</li>
                    <li>Gestionar usuarios del sistema (cuentas y roles)</li>
                    <li>Acceso total sin restricciones</li>
                  </ul>
                </div>
                <div className="role-card role-coord">
                  <h3>🔵 Coordinador <span className="pill pill-blue">coordinador</span></h3>
                  <ul>
                    <li>Ver la Vista de Hoy (todos los grupos)</li>
                    <li>Registrar y consultar asistencia</li>
                    <li>Consultar el roll semanal de cualquier grupo</li>
                    <li>Marcar excepciones de la semana</li>
                    <li>No puede crear ni modificar colaboradores ni grupos</li>
                    <li>No puede gestionar usuarios ni exportar informes</li>
                  </ul>
                </div>
                <div className="role-card role-oficial">
                  <h3>🟢 Oficial <span className="pill pill-green">oficial</span></h3>
                  <ul>
                    <li>Solo puede ver <b>su propio</b> turno actual y próximo</li>
                    <li>No accede a otros colaboradores ni informes</li>
                    <li>Vista simplificada y de solo lectura</li>
                    <li>No puede registrar asistencia</li>
                  </ul>
                </div>
              </div>
              <div className="callout warn mt14">
                <span className="ci">⚠️</span>
                <div><b>Primer acceso:</b> El admin inicial se crea con la cuenta <code>admin@rollmanager.com</code>. Desde el panel de Usuarios puedes crear nuevas cuentas para coordinadores y oficiales. <b>Crea los usuarios solo después de tener los colaboradores y grupos listos.</b></div>
              </div>
              <div className="callout info">
                <span className="ci">ℹ️</span>
                <div>La cuenta de un oficial <b>no se conecta automáticamente</b> a su nombre de colaborador. Son entidades separadas. El oficial simplemente inicia sesión y ve el turno calculado según el grupo al que pertenece.</div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════
               3 · CONCEPTOS CLAVE
          ══════════════════════════════════════ */}
          <section className="section amber" id="conceptos">
            <div className="section-header">
              <div className="icon">💡</div>
              <div>
                <h2>Conceptos clave</h2>
                <p>Sin esto, la configuración no va a tener sentido</p>
              </div>
            </div>
            <div className="section-body">

              {/* 3.1 Turnos */}
              <h3 id="turnos" className="text-base font-semibold mb-2">Los 3 turnos (fijos, nunca cambian)</h3>
              <div className="turn-cards mt8">
                <div className="turn-card t1">
                  <div className="t-label">T1 · Mañana</div>
                  <div className="t-time">06:00 – 14:00</div>
                  <div className="t-note">8 horas diurnas</div>
                </div>
                <div className="turn-card t2">
                  <div className="t-label">T2 · Tarde</div>
                  <div className="t-time">14:00 – 22:00</div>
                  <div className="t-note">8 horas vespertinas</div>
                </div>
                <div className="turn-card t3">
                  <div className="t-label">T3 · Noche</div>
                  <div className="t-time">22:00 – 06:00</div>
                  <div className="t-note">8 horas nocturnas</div>
                </div>
              </div>

              <hr className="sep" />

              {/* 3.2 Rotación */}
              <h3 id="rotacion" className="text-base font-semibold mb-2">Rotación semanal</h3>
              <p className="g-sm">Cada semana (empezando el lunes), el turno de cada grupo avanza en este ciclo:</p>
              <div className="flow mt14">
                <div className="flow-item">T3 · Noche</div>
                <div className="flow-arrow">→</div>
                <div className="flow-item">T2 · Tarde</div>
                <div className="flow-arrow">→</div>
                <div className="flow-item">T1 · Mañana</div>
                <div className="flow-arrow">→</div>
                <div className="flow-item">T3 · Noche</div>
                <div className="flow-arrow">→</div>
                <div className="flow-item">…</div>
              </div>
              <div className="callout info mt8">
                <span className="ci">ℹ️</span>
                <div>El sistema calcula automáticamente en qué turno está cada grupo cada semana, usando la <b>fecha de inicio de rotación</b> que configuraste al crear el grupo. Tú no tienes que calcular nada.</div>
              </div>

              <hr className="sep" />

              {/* 3.3 Grupos */}
              <h3 id="grupos" className="text-base font-semibold mb-2">¿Qué es un "Grupo"?</h3>
              <p className="g-sm">Un grupo es un conjunto de colaboradores que rotan juntos. Todos los del mismo grupo siempre están en el mismo turno la misma semana. Cada grupo tiene su propio punto de inicio en el ciclo de rotación (su <b>fecha de inicio</b>).</p>
              <p className="mt8 g-sm">Ejemplo: el Grupo A puede estar en T1 esta semana mientras el Grupo B está en T3. Son independientes.</p>

              <hr className="sep" />

              {/* 3.4 Modalidades */}
              <h3 id="modalidades" className="text-base font-semibold mb-2">Modalidades de colaborador — muy importante</h3>
              <div className="tbl-wrap mt8">
                <table>
                  <thead>
                    <tr>
                      <th>Modalidad</th>
                      <th>Nombre</th>
                      <th>¿Qué hace?</th>
                      <th>Turnos en que trabaja</th>
                      <th>Ciclo propio</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="pill pill-blue">FULL</span></td>
                      <td>Turno mixto</td>
                      <td>Rota en los 3 turnos junto con su grupo</td>
                      <td>T1 + T2 + T3</td>
                      <td>21 días (3 semanas)</td>
                    </tr>
                    <tr>
                      <td><span className="pill pill-amber">MT</span></td>
                      <td>Turno doble</td>
                      <td>Rota solo entre Mañana y Tarde. Cuando el grupo va a Noche, él se queda en Tarde.</td>
                      <td>T1 + T2 (nunca T3)</td>
                      <td>14 días (2 semanas)</td>
                    </tr>
                    <tr>
                      <td><span className="pill pill-green">FIJO T1</span></td>
                      <td>Fijo mañana</td>
                      <td>Siempre trabaja de 06:00 a 14:00, sin importar el turno del grupo</td>
                      <td>Solo T1</td>
                      <td>Sin ciclo</td>
                    </tr>
                    <tr>
                      <td><span className="pill pill-green">FIJO T2</span></td>
                      <td>Fijo tarde</td>
                      <td>Siempre trabaja de 14:00 a 22:00, sin importar el turno del grupo</td>
                      <td>Solo T2</td>
                      <td>Sin ciclo</td>
                    </tr>
                    <tr className="row-purple">
                      <td><span className="pill pill-purple">MT_ALTERNO</span></td>
                      <td>Alterno M/T</td>
                      <td>Alterna T1 y T2 en bloques de 2 días, con un ciclo propio de 2 semanas. Miércoles siempre libre. <b>Nunca trabaja T3.</b></td>
                      <td>T1 + T2 (nunca T3)</td>
                      <td>14 días (A/B independiente del grupo)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="callout warn mt14">
                <span className="ci">⚠️</span>
                <div>Si configuras mal la modalidad de un colaborador, el sistema mostrará el turno equivocado. <b>Asegúrate de saber qué modalidad tiene cada oficial antes de crearlo.</b></div>
              </div>

              <hr className="sep" />

              {/* 3.5 MT_ALTERNO */}
              <h3 id="mt-alterno" className="text-base font-semibold mb-2">Modalidad MT_ALTERNO — detalle completo</h3>
              <p className="g-sm">Esta modalidad es la más especial del sistema. El colaborador alterna entre Mañana y Tarde <b>en bloques de 2 días</b>, con un ciclo personal de 2 semanas (Semana A y Semana B). El miércoles <b>siempre es libre</b>.</p>
              <div className="callout info mt8">
                <span className="ci">🔄</span>
                <div><b>El ciclo de este colaborador es independiente del grupo al que pertenece.</b> Se basa en su propia <code>fechaInicioPersonal</code> (un lunes de referencia donde comenzó Semana A).</div>
              </div>
              <p className="mt14 g-sm"><b>Patrón semanal (Semana A y Semana B):</b></p>
              <div className="tbl-wrap mt8">
                <table className="week-table">
                  <thead>
                    <tr>
                      <th>Semana</th>
                      <th>Lun</th>
                      <th>Mar</th>
                      <th>Mié</th>
                      <th>Jue</th>
                      <th>Vie</th>
                      <th>Sáb</th>
                      <th>Dom</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><b>A</b> <span className="pill pill-blue">par</span></td>
                      <td><span className="day-t2">T</span></td>
                      <td><span className="day-t2">T</span></td>
                      <td><span className="day-lib">Libre</span></td>
                      <td><span className="day-t1">M</span></td>
                      <td><span className="day-t1">M</span></td>
                      <td><span className="day-t2">T</span></td>
                      <td><span className="day-t2">T</span></td>
                    </tr>
                    <tr>
                      <td><b>B</b> <span className="pill pill-amber">impar</span></td>
                      <td><span className="day-t1">M</span></td>
                      <td><span className="day-t1">M</span></td>
                      <td><span className="day-lib">Libre</span></td>
                      <td><span className="day-t2">T</span></td>
                      <td><span className="day-t2">T</span></td>
                      <td><span className="day-t1">M</span></td>
                      <td><span className="day-t1">M</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt8 g-xs-muted">M = Mañana (T1 · 06:00–14:00) · T = Tarde (T2 · 14:00–22:00) · Libre = día libre fijo</p>
              <p className="mt14 g-sm"><b>¿Cómo saber qué semana corresponde hoy?</b></p>
              <p className="g-sm">El sistema cuenta cuántas semanas han pasado desde la <code>fechaInicioPersonal</code> (lunes de Semana A). Si el número de semanas transcurridas es <b>par → Semana A</b>, si es <b>impar → Semana B</b>.</p>
              <div className="callout warn mt8">
                <span className="ci">⚠️</span>
                <div>
                  <b>¿Cómo configurar <code>fechaInicioPersonal</code>?</b><br />
                  Debe ser un <b>lunes</b> donde el colaborador estuvo en <b>Semana A</b> (lunes de Tarde).<br /><br />
                  <b>Ejemplo práctico (sábado 30 may 2026):</b><br />
                  — Si el colaborador trabaja <b>hoy de Tarde (T2)</b>, sábado es Semana A → el lunes de esa semana es <b>26 may 2026</b>. Pon <code>fechaInicioPersonal = lunes 26 may 2026</code>.<br />
                  — Si el colaborador trabaja <b>hoy de Mañana (T1)</b>, sábado es Semana B → la Semana A anterior comenzó el <b>lunes 19 may 2026</b>. Pon <code>fechaInicioPersonal = lunes 19 may 2026</code>.
                </div>
              </div>

              <hr className="sep" />

              {/* 3.6 Días libres configurables */}
              <h3 id="dias-libres" className="text-base font-semibold mb-2">Días libres configurables</h3>
              <p className="g-sm">Los días libres <b>no son fijos por modalidad</b> (excepto el miércoles de MT_ALTERNO). El coordinador elige manualmente el día libre de cada colaborador al crearlo o editarlo.</p>
              <div className="tbl-wrap mt8">
                <table>
                  <thead>
                    <tr>
                      <th>Campo</th>
                      <th>Para qué sirve</th>
                      <th>¿Quién lo tiene?</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>diaLibre</code></td>
                      <td>Día libre principal del colaborador (Lunes–Domingo o "Sin día libre")</td>
                      <td>Todos los colaboradores activos</td>
                    </tr>
                    <tr>
                      <td><code>diaLibreExtra</code></td>
                      <td>Segundo día libre opcional — p. ej. colaboradores FULL en T3 que liberan Viernes + Sábado</td>
                      <td>Opcional — solo si tiene 2 días libres</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="callout ok mt8">
                <span className="ci">✅</span>
                <div>Cuando un colaborador tiene configurado su día libre, ese día <b>no aparece en la Vista de Asistencia</b> — el sistema lo salta automáticamente para no registrarlo como ausente.</div>
              </div>
              <div className="callout info">
                <span className="ci">ℹ️</span>
                <div>Para colaboradores <b>MT_ALTERNO</b>, el miércoles es libre <b>estructuralmente por el patrón A/B</b>. No necesitas configurarlo en <code>diaLibre</code>, el sistema ya lo sabe. Puedes usar <code>diaLibre</code> para un día libre adicional si lo tiene.</div>
              </div>

              <hr className="sep" />

              {/* 3.7 Excepciones */}
              <h3 id="excepciones" className="text-base font-semibold mb-2">Excepciones de la semana</h3>
              <p className="g-sm">Cuando un colaborador no va a trabajar una semana completa (vacaciones, permiso, ausencia), se registra como excepción. Aparecerá en la Vista de Hoy con su nombre tachado para que sepas que no está disponible.</p>
              <div className="tbl-wrap mt8">
                <table>
                  <thead>
                    <tr><th>Tipo</th><th>Cuándo usarla</th></tr>
                  </thead>
                  <tbody>
                    <tr><td><span className="pill pill-blue">Vacaciones</span></td><td>El colaborador está en sus días de descanso programados</td></tr>
                    <tr><td><span className="pill pill-amber">Permiso</span></td><td>Tiene autorización para ausentarse (permiso con goce, cita médica, etc.)</td></tr>
                    <tr><td><span className="pill pill-red">Ausencia</span></td><td>No se presentó sin justificación previa</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════
               4 · ORDEN DE CONFIGURACIÓN
          ══════════════════════════════════════ */}
          <section className="section indigo" id="orden">
            <div className="section-header">
              <div className="icon">🔢</div>
              <div>
                <h2>Orden correcto de configuración</h2>
                <p>Sigue estos pasos exactamente en este orden la primera vez</p>
              </div>
            </div>
            <div className="section-body">
              <div className="callout error">
                <span className="ci">🚫</span>
                <div><b>No saltes pasos.</b> Si creas colaboradores antes de tener grupos, no podrás asignarlos correctamente. Si creas usuarios del sistema antes de tener colaboradores, la Vista de Hoy quedará vacía y confundirá a los oficiales.</div>
              </div>
              <ol className="steps mt18">

                <li>
                  <div>
                    <div className="step-title">Crear los Grupos de rotación</div>
                    <div className="step-desc">
                      Ve a <b>Grupos</b> en el menú. Crea un grupo por cada equipo que rota independientemente.<br /><br />
                      <b>Datos que necesitas por cada grupo:</b>
                      <ul className="g-list">
                        <li><b>Nombre del grupo</b> — p. ej. &ldquo;Grupo A&rdquo;, &ldquo;Grupo Norte&rdquo;</li>
                        <li><b>Turno inicial</b> — en qué turno estaba ese grupo en la semana de inicio (T1, T2 o T3)</li>
                        <li><b>Fecha de inicio de rotación</b> — cualquier lunes donde sepas con certeza en qué turno estaba el grupo ese día</li>
                      </ul>
                      <div className="callout warn mt8">
                        <span className="ci">⚠️</span>
                        <div>La <b>fecha de inicio de rotación</b> es el dato más crítico del sistema. Si la pones mal, <b>todos los turnos de ese grupo estarán mal calculados</b>. Verifica con los registros históricos o con el coordinador antes de ingresarla.</div>
                      </div>
                    </div>
                  </div>
                </li>

                <li>
                  <div>
                    <div className="step-title">Crear los Colaboradores</div>
                    <div className="step-desc">
                      Ve a <b>Colaboradores</b> en el menú. Crea uno por cada oficial activo.<br /><br />
                      <b>Datos que necesitas por cada colaborador:</b>
                      <ul className="g-list">
                        <li><b>Nombre completo</b></li>
                        <li><b>Puesto</b> — cargo o posición (p. ej. &ldquo;Oficial de seguridad&rdquo;, &ldquo;Supervisor&rdquo;)</li>
                        <li><b>Grupo al que pertenece</b> — el que creaste en el Paso 1</li>
                        <li><b>Modalidad</b> — FULL / MT / FIJO T1 / FIJO T2 / MT_ALTERNO (ver tabla arriba)</li>
                        <li><b>Día libre</b> — elige el día de descanso semanal (o &ldquo;Sin día libre&rdquo;)</li>
                        <li><b>Día libre extra</b> — opcional, si tiene 2 días libres (p. ej. FULL que libra Vie + Sáb)</li>
                        <li className="c-purple"><b>Fecha de inicio personal</b> — <i>solo para MT_ALTERNO</i>: el lunes donde comenzó Semana A para este colaborador</li>
                      </ul>
                      <div className="callout info mt8">
                        <span className="ci">ℹ️</span>
                        <div>Si la modalidad es <span className="pill pill-purple">MT_ALTERNO</span>, el campo <code>fechaInicioPersonal</code> se vuelve visible y obligatorio. Consulta la sección <a href="#mt-alterno">MT_ALTERNO</a> para saber qué fecha ingresar.</div>
                      </div>
                    </div>
                  </div>
                </li>

                <li>
                  <div>
                    <div className="step-title">Verificar la Vista de Hoy</div>
                    <div className="step-desc">
                      Cuando termines de crear grupos y colaboradores, ve a la pantalla <b>Hoy</b> (es la primera que aparece al entrar como admin).<br /><br />
                      Deberías ver los nombres distribuidos en las tarjetas de turno (Mañana / Tarde / Noche).<br /><br />
                      <b>¿Qué verificar?</b>
                      <ul className="g-list">
                        <li>¿Aparecen todos los colaboradores activos?</li>
                        <li>¿Están en el turno correcto para hoy?</li>
                        <li>¿Los MT/MT_ALTERNO no aparecen en Noche?</li>
                        <li>¿Los FIJO están siempre en su turno fijo?</li>
                        <li>¿El colaborador MT_ALTERNO está en el turno correcto para el día de hoy?</li>
                      </ul>
                      Si algo está mal, regresa al Paso 1 y corrige la fecha de inicio del grupo afectado (o la <code>fechaInicioPersonal</code> del colaborador MT_ALTERNO).
                    </div>
                  </div>
                </li>

                <li>
                  <div>
                    <div className="step-title">Crear los usuarios del sistema</div>
                    <div className="step-desc">
                      Ve a <b>Usuarios</b> en el menú. Crea una cuenta por cada persona que necesite acceder al sistema.<br /><br />
                      <b>Tipos de cuenta:</b>
                      <ul className="g-list">
                        <li><span className="pill pill-red">admin</span> — Para el administrador principal. Tiene control total.</li>
                        <li><span className="pill pill-sky">coordinador</span> — Para quien supervisa y registra asistencia pero no administra.</li>
                        <li><span className="pill pill-green">oficial</span> — Para cada oficial que quiere ver su propio turno desde su celular.</li>
                      </ul>
                      <div className="callout info mt8">
                        <span className="ci">ℹ️</span>
                        <div>El correo y contraseña que ingresas aquí son los que cada persona usa para iniciar sesión en <code>https://roll-manager.ezekl.com/login</code>.</div>
                      </div>
                    </div>
                  </div>
                </li>

                <li>
                  <div>
                    <div className="step-title">El sistema ya está listo para uso diario</div>
                    <div className="step-desc">
                      A partir de aquí no necesitas reconfigurar nada salvo que:
                      <ul className="g-list">
                        <li>Se integre un colaborador nuevo → agrégalo en <b>Colaboradores</b></li>
                        <li>Un colaborador se inactiva → márcalo como inactivo en <b>Colaboradores</b> (no lo borres)</li>
                        <li>Se crea un nuevo grupo → agrégalo en <b>Grupos</b></li>
                      </ul>
                      Los turnos se calculan automáticamente cada semana. No tienes que hacer nada los lunes.
                    </div>
                  </div>
                </li>

              </ol>
            </div>
          </section>

          {/* ══════════════════════════════════════
               5 · USO DIARIO
          ══════════════════════════════════════ */}
          <section className="section green" id="flujos">
            <div className="section-header">
              <div className="icon">📆</div>
              <div>
                <h2>Uso diario del sistema</h2>
                <p>Lo que hay que hacer cada día</p>
              </div>
            </div>
            <div className="section-body">
              <p><b>Rutina del administrador/coordinador cada día:</b></p>
              <ol className="steps mt14">

                <li>
                  <div>
                    <div className="step-title">Ver la Vista de Hoy</div>
                    <div className="step-desc">
                      Entra a la app → pantalla <b>Hoy</b>. Verás inmediatamente quién está en cada turno hoy.<br />
                      <span className="pill pill-sky">T1 Mañana</span>{" "}<span className="pill pill-amber">T2 Tarde</span>{" "}<span className="pill pill-indigo">T3 Noche</span>{" "}<span className="pill pill-green">Libres</span><br /><br />
                      Si algún colaborador tiene excepción activa esa semana, su nombre aparece tachado. Si tiene día libre hoy, aparece en la sección &ldquo;Libres&rdquo;.
                    </div>
                  </div>
                </li>

                <li>
                  <div>
                    <div className="step-title">Registrar asistencia (sección Asistencia)</div>
                    <div className="step-desc">
                      Ve a <b>Asistencia</b>. El sistema muestra automáticamente los colaboradores del día con su turno.<br /><br />
                      Por cada colaborador marca su estado:
                      <ul className="g-list">
                        <li><span className="pill pill-green">Presente</span> — llegó y está trabajando</li>
                        <li><span className="pill pill-red">Ausente</span> — no se presentó</li>
                        <li><span className="pill pill-amber">Permiso</span> — tiene autorización de ausencia</li>
                      </ul>
                      Los colaboradores que tienen día libre configurado para hoy <b>no aparecen en la lista</b> de asistencia.
                    </div>
                  </div>
                </li>

                <li>
                  <div>
                    <div className="step-title">Marcar excepciones de la semana (si aplica)</div>
                    <div className="step-desc">
                      Si esta semana un colaborador tiene vacaciones o permiso, ve a <b>Roll</b>, selecciona el grupo y la semana, y marca la excepción al lado de su nombre.<br /><br />
                      Esto hará que aparezca tachado en la Vista de Hoy durante toda esa semana.
                    </div>
                  </div>
                </li>

                <li>
                  <div>
                    <div className="step-title">Generar el informe diario (si se requiere)</div>
                    <div className="step-desc">
                      Ve a <b>Informes</b>.<br /><br />
                      <b>Para crear un informe nuevo:</b>
                      <ol className="g-list-h">
                        <li>Clic en <b>&ldquo;+ Nuevo informe&rdquo;</b></li>
                        <li>Escribe el borrador con las novedades del día (en lenguaje normal)</li>
                        <li>Clic en <b>&ldquo;✦ Formalizar con IA&rdquo;</b> → la IA reescribe el texto en tono oficial e institucional</li>
                        <li>Revisa y edita el resultado si algo no quedó bien</li>
                        <li>Clic en <b>&ldquo;↓ Exportar PDF&rdquo;</b> → se descarga el archivo</li>
                        <li>Abre WhatsApp y comparte el PDF manualmente con quien corresponda</li>
                      </ol>
                    </div>
                  </div>
                </li>

              </ol>

              <hr className="sep" />

              <p><b>¿Cuándo usar la sección &ldquo;Roll&rdquo;?</b></p>
              <p className="mt8 g-sm">La sección Roll permite ver el horario completo de un grupo para cualquier semana (pasada o futura). También es donde se gestionan las excepciones por colaborador.</p>
              <div className="tbl-wrap mt8">
                <table>
                  <thead>
                    <tr><th>Cuándo entrar al Roll</th><th>Para qué</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Un colaborador va a tomar vacaciones</td><td>Marcar excepción &ldquo;Vacaciones&rdquo; para esa semana</td></tr>
                    <tr><td>Necesitas saber qué turno tendrá X grupo en 3 semanas</td><td>Seleccionar el grupo y la semana futura</td></tr>
                    <tr><td>Quieres revisar el historial de un grupo</td><td>Seleccionar el grupo y una semana pasada</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════
               6 · VISTA DEL OFICIAL
          ══════════════════════════════════════ */}
          <section className="section purple" id="oficial-view">
            <div className="section-header">
              <div className="icon">👁️</div>
              <div>
                <h2>Vista del oficial</h2>
                <p>Qué ve cada rol cuando inicia sesión</p>
              </div>
            </div>
            <div className="section-body">
              <p className="g-sm">Cuando un oficial inicia sesión, ve una vista simplificada con su propio turno únicamente.</p>
              <div className="turn-cards mt14">
                <div className="turn-card t1">
                  <div className="t-label">Para FULL / MT / FIJO</div>
                  <div className="t-time">Tu turno esta semana</div>
                  <div className="t-note">El oficial ve el turno asignado para toda la semana en curso y la próxima semana.</div>
                </div>
                <div className="turn-card t3">
                  <div className="t-label">Para MT_ALTERNO</div>
                  <div className="t-time">Tu turno día por día</div>
                  <div className="t-note">Dado que el turno cambia por día (Lun/Mar = T, Jue/Vie = M, etc.), el oficial ve el turno de cada día individualmente.</div>
                </div>
              </div>
              <div className="callout info mt8">
                <span className="ci">ℹ️</span>
                <div>
                  <b>El oficial no puede ver a otros colaboradores ni registrar asistencia.</b> Su vista es de solo lectura y solo muestra su turno.<br /><br />
                  Si un oficial ve el turno equivocado, el problema casi siempre está en la <b>fecha de inicio del grupo</b> o en la <b>modalidad del colaborador</b>. El admin puede corregirlo desde <b>Colaboradores</b>.
                </div>
              </div>
              <div className="callout warn mt8">
                <span className="ci">⚠️</span>
                <div>
                  Si un oficial puede ver a otros colaboradores o tiene acceso a informes/asistencia, significa que se le asignó el rol <code>admin</code> o <code>coordinador</code> por error. Corrígelo en <b>Usuarios</b>.
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════
               7 · ERRORES COMUNES
          ══════════════════════════════════════ */}
          <section className="section red" id="errores">
            <div className="section-header">
              <div className="icon">🚨</div>
              <div>
                <h2>Errores comunes y cómo evitarlos</h2>
                <p>Lee esto antes de empezar a configurar</p>
              </div>
            </div>
            <div className="section-body">
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Error</th>
                      <th>Por qué pasa</th>
                      <th>Cómo evitarlo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><b>Los turnos de todos están mal</b></td>
                      <td>La fecha de inicio de rotación del grupo está mal configurada</td>
                      <td>Antes de crear el grupo, confirma con un registro histórico en qué turno estaba ese grupo en un lunes específico</td>
                    </tr>
                    <tr>
                      <td><b>Un colaborador MT aparece en Noche</b></td>
                      <td>Se creó con modalidad FULL en vez de MT</td>
                      <td>Al crear/editar el colaborador, seleccionar correctamente la modalidad</td>
                    </tr>
                    <tr>
                      <td><b>Un FIJO aparece en el turno del grupo</b></td>
                      <td>Se creó con modalidad FULL en vez de FIJO T1/T2</td>
                      <td>Verificar la modalidad al crear el colaborador</td>
                    </tr>
                    <tr>
                      <td><b>El colaborador MT_ALTERNO está en el turno equivocado</b></td>
                      <td>La <code>fechaInicioPersonal</code> está mal configurada</td>
                      <td>Verificar en qué turno estaba hoy y calcular el lunes de Semana A correcto (ver sección MT_ALTERNO arriba)</td>
                    </tr>
                    <tr>
                      <td><b>El MT_ALTERNO aparece trabajando el miércoles</b></td>
                      <td>Puede ser un error de visualización o fecha mal configurada</td>
                      <td>El miércoles siempre debe ser LIBRE para MT_ALTERNO; revisar <code>fechaInicioPersonal</code></td>
                    </tr>
                    <tr>
                      <td><b>Un colaborador aparece en asistencia en su día libre</b></td>
                      <td>El campo <code>diaLibre</code> no fue configurado</td>
                      <td>Editar el colaborador y asignarle el día libre correspondiente</td>
                    </tr>
                    <tr>
                      <td><b>La Vista de Hoy está vacía</b></td>
                      <td>No hay grupos o colaboradores activos, o la fecha de inicio es muy futura</td>
                      <td>Verificar que haya al menos un grupo y un colaborador activos, y que la fecha de inicio ya haya pasado</td>
                    </tr>
                    <tr>
                      <td><b>Un colaborador no aparece en la Vista de Hoy</b></td>
                      <td>Está marcado como inactivo, o tiene una excepción para esta semana, o hoy es su día libre</td>
                      <td>Revisar en <b>Colaboradores</b> que esté activo; revisar en <b>Roll</b> que no tenga excepción</td>
                    </tr>
                    <tr>
                      <td><b>El informe no se formaliza con IA</b></td>
                      <td>El borrador está vacío, o hay un problema temporal de conexión</td>
                      <td>Escribir al menos 2–3 líneas antes de presionar &ldquo;Formalizar&rdquo;. Intentar de nuevo si falla</td>
                    </tr>
                    <tr>
                      <td><b>Un oficial ve los turnos de otros</b></td>
                      <td>Se le asignó el rol <code>admin</code> o <code>coordinador</code> por error</td>
                      <td>Revisar en <b>Usuarios</b> y cambiar el rol a <code>oficial</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <hr className="sep" />
              <p><b>Regla de oro para no romper los turnos:</b></p>
              <div className="callout ok mt8">
                <span className="ci">✅</span>
                <div>
                  <b>Siempre verifica la Vista de Hoy después de cualquier cambio.</b><br />
                  Si los turnos se ven correctos ahí, el sistema está bien configurado. Si algo se ve raro, el problema casi siempre está en la fecha de inicio del grupo o en la modalidad/fechaInicioPersonal del colaborador.
                </div>
              </div>
              <hr className="sep" />
              <p><b>Resumen visual del orden correcto:</b></p>
              <div className="flow mt14 flow-wrap">
                <div className="flow-item fi-1">1. Grupos</div>
                <div className="flow-arrow">→</div>
                <div className="flow-item fi-2">2. Colaboradores</div>
                <div className="flow-arrow">→</div>
                <div className="flow-item fi-3">3. Verificar Vista Hoy</div>
                <div className="flow-arrow">→</div>
                <div className="flow-item fi-4">4. Usuarios/Cuentas</div>
                <div className="flow-arrow">→</div>
                <div className="flow-item fi-5">5. Uso diario</div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════
               8 · FAQ
          ══════════════════════════════════════ */}
          <section className="section blue" id="faq">
            <div className="section-header">
              <div className="icon">❓</div>
              <div>
                <h2>Preguntas frecuentes</h2>
                <p>Dudas comunes con respuesta directa</p>
              </div>
            </div>
            <div className="section-body">

              <div className="faq-item">
                <div className="faq-q">¿Tengo que hacer algo cada lunes para que los turnos cambien?</div>
                <div className="faq-a">No. El sistema calcula los turnos automáticamente. Los lunes, al abrir la Vista de Hoy, ya verás los turnos nuevos sin ninguna acción de tu parte.</div>
              </div>

              <div className="faq-item">
                <div className="faq-q">¿Cómo sé qué <code>fechaInicioPersonal</code> poner para un colaborador MT_ALTERNO?</div>
                <div className="faq-a">
                  Necesitas saber en qué turno está el colaborador hoy.<br /><br />
                  — Si hoy trabaja de <b>Tarde (T)</b>, estás en Semana A. Busca el lunes más reciente y ponlo como <code>fechaInicioPersonal</code>.<br />
                  — Si hoy trabaja de <b>Mañana (M)</b>, estás en Semana B. Busca el lunes anterior a esa semana (la Semana A previa) y ponlo.<br /><br />
                  Recuerda: la fecha siempre debe ser un <b>lunes</b>.
                </div>
              </div>

              <div className="faq-item">
                <div className="faq-q">¿Puedo tener colaboradores de diferentes grupos en la misma Vista de Hoy?</div>
                <div className="faq-a">Sí. La Vista de Hoy muestra a <b>todos los colaboradores activos de todos los grupos</b> agrupados por turno. Los grupos solo afectan cómo se calcula qué turno les corresponde, pero la vista es unificada.</div>
              </div>

              <div className="faq-item">
                <div className="faq-q">¿Qué pasa si un colaborador MT_ALTERNO tiene vacaciones esta semana?</div>
                <div className="faq-a">Igual que cualquier otro: ve a <b>Roll</b>, selecciona el grupo y la semana, y marca la excepción &ldquo;Vacaciones&rdquo; para ese colaborador. Aparecerá tachado en la Vista de Hoy durante esa semana.</div>
              </div>

              <div className="faq-item">
                <div className="faq-q">¿El informe generado por IA se guarda automáticamente?</div>
                <div className="faq-a">Sí. El borrador y el texto formalizado quedan guardados en el sistema. Puedes acceder a informes anteriores desde la sección <b>Informes</b>. El PDF se genera al exportar y debes guardarlo manualmente en tu dispositivo.</div>
              </div>

              <div className="faq-item">
                <div className="faq-q">¿Puedo editar un colaborador después de crearlo?</div>
                <div className="faq-a">Sí. Ve a <b>Colaboradores</b>, encuentra al colaborador y edítalo. Puedes cambiar su modalidad, día libre, grupo, o <code>fechaInicioPersonal</code>. Los cambios se reflejan inmediatamente en la Vista de Hoy.</div>
              </div>

              <div className="faq-item">
                <div className="faq-q">¿Qué hago si necesito agregar un nuevo grupo a mitad del ciclo operativo?</div>
                <div className="faq-a">Créalo en <b>Grupos</b> con una <code>fechaInicioRotacion</code> en el pasado — un lunes donde puedas confirmar en qué turno estaba ese grupo. Luego asigna los colaboradores y verifica la Vista de Hoy para confirmar que todo esté correcto.</div>
              </div>

              <div className="faq-item">
                <div className="faq-q">¿Cuántos colaboradores activos puedo tener?</div>
                <div className="faq-a">No hay un límite técnico, pero el sistema está pensado para operaciones de hasta ~20 colaboradores activos por conveniencia visual en las vistas de turno.</div>
              </div>

              <div className="faq-item">
                <div className="faq-q">¿Qué pasa si me equivoco en la fecha de inicio de rotación de un grupo?</div>
                <div className="faq-a">Todos los turnos de ese grupo estarán desfasados. Edita el grupo y corrige la fecha. El sistema recalculará automáticamente todos los turnos. No se pierde ningún dato de asistencia anterior.</div>
              </div>

            </div>
          </section>

          {/* Footer */}
          <footer className="g-footer">
            Roll Manager · An Allied Universal Company · 2026 ·{" "}
            <Link href="/" className="text-blue-500 hover:underline">Ir al inicio</Link>
          </footer>

        </div>
      </div>
    </>
  );
}
