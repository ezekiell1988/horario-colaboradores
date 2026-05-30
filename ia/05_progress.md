# 05 — Progreso del Proyecto

> **Última actualización:** 2026-05-30
> **Fase activa:** Fase 5 — Pulido y Despliegue

## ✅ Completado

### PC-01: Scaffolding del proyecto ✅
- Proyecto Next.js 15 + TypeScript + Tailwind inicializado en `src/`
- `app/page.tsx` limpia (placeholder Roll Manager)
- `.env.local` con todas las variables completas
- `.env.example` documentado
- Build `npm run build` ✓
- Ver TASK-SETUP-01

### PC-02: Prisma + Azure SQL ✅
- Prisma 7 instalado con provider `sqlserver`
- Schema `rm` creado en Azure SQL (schema propio, aislado)
- 5 tablas creadas: `rm.User`, `rm.Colaborador`, `rm.Grupo`, `rm.Asistencia`, `rm.Informe`
- `db push` ✓ — BD en sync con el schema
- Cliente Prisma generado (`prisma generate` ✓)
- `lib/prisma.ts` singleton listo
- `prisma.config.ts` con `DATABASE_URL` desde env
- Ver TASK-SETUP-02

### PC-03: NextAuth.js v5 ✅
- `lib/auth.ts` — CredentialsProvider con bcrypt + `rm.User`
- `types/next-auth.d.ts` — tipos extendidos (`id`, `rol` en JWT y Session)
- `app/(auth)/login/page.tsx` — formulario email+contraseña (labels vinculados, accesible)
- `proxy.ts` — protección de `/admin/**` (rol admin) y `/oficial/**` (rol oficial)
- `app/api/auth/[...nextauth]/route.ts` — handler de NextAuth
- `prisma/seed.ts` — seed ejecutado ✓ (`admin@rollmanager.com` / `Admin1234!`)
- Build limpio ✓
- Ver TASK-SETUP-03

## 🔄 En curso — Fase 5: Pulido y Despliegue

### UI mobile-first ✅
- `app/api/colaboradores/route.ts` + `[id]/route.ts` — GET/POST/PUT/DELETE, sesión validada
- `app/api/grupos/route.ts` + `[id]/route.ts` — GET/POST/PUT/DELETE, guarda con conteo, bloquea borrado si tiene colaboradores
- `app/(admin)/admin/colaboradores/page.tsx` — lista + modal (activar/desactivar, editar, cambiar grupo)
- `app/(admin)/admin/grupos/page.tsx` — lista + modal (turnoInicioIndex, fechaInicioRotacion)
- `components/AdminNav.tsx` — nav admin con links a secciones
- `app/(admin)/admin/layout.tsx` — layout con nav, redirect `/admin` → `/admin/colaboradores`
- Build limpio ✓
- Ver TASK-ROLL-01

### PC-05: RollEngine ✅
- `lib/roll-engine.ts` — `getWeekStart()` + `getTurnoForWeek()`, lógica de módulo seguro (semanas negativas)
- `jest.config.ts` — preset ts-jest, env node, moduleNameMapper
- `lib/__tests__/roll-engine.test.ts` — 11 tests: semana 0, +1, +2, +3 (ciclo), T2 inicio, fechas pasadas, cruce año nuevo, mid-week
- `npm test` — 11/11 ✓
- Ver TASK-ROLL-02

### PC-06: Vista del Roll Semanal ✅
- `app/api/roll/route.ts` — GET grupoId + fecha → turno + colaboradores activos
- `app/(admin)/admin/roll/page.tsx` — selector de grupo, navegación semanal, colores por turno
- `app/api/oficial/turno/route.ts` — turno actual y próximo del oficial logueado
- `app/(oficial)/layout.tsx` + `components/OficialNav.tsx` — layout y nav del oficial
- `app/(oficial)/oficial/page.tsx` — tarjeta grande con turno actual + tarjeta próxima semana
- `components/AdminNav.tsx` — enlace "Roll" agregado
- Build limpio ✓
- Ver TASK-ROLL-03

### PC-07: Asistencia Diaria ✅
- `app/api/asistencia/route.ts` — GET ?fecha=, upsert automático de registros (estado inicial "presente")
- `app/api/asistencia/[id]/route.ts` — PATCH estado/puesto con validación
- `components/AttendanceTable.tsx` — tabla editable con select de estado + input puesto con debounce
- `app/(admin)/admin/asistencia/page.tsx` — navegador de días + resumen presente/ausente/permiso + tabla
- `components/AdminNav.tsx` — enlace "Asistencia" agregado
- Build limpio ✓
- Ver TASK-ASIST-01

### PC-09: Informes con IA ✅
- `prisma/schema.prisma` — campo `textoFormal String? @db.NVarChar(Max)` agregado a Informe + `db push` + `generate`
- `lib/azure-ai.ts` — `formalizarTexto(borrador)` via gpt-5.5 (max_completion_tokens, sin temperature)
- `app/api/informes/route.ts` — GET ?mes=YYYY-MM + POST crear informe
- `app/api/informes/[id]/route.ts` — GET detalle + PUT titulo/contenido/textoFormal + DELETE
- `app/api/informes/formalizar/route.ts` — POST llama azure-ai y devuelve textoFormal
- `components/ReportEditor.tsx` — textarea borrador con autoguardado debounce 2s + botón "✦ Formalizar con IA" + área editable del resultado
- `app/(admin)/admin/informes/page.tsx` — sidebar con nav mensual + crear nuevo + lista; editor a la derecha
- `components/AdminNav.tsx` — enlace "Informes" agregado
- Build limpio ✓
- Ver TASK-INFORME-01 / TASK-INFORME-02

### PC-10: Exportar PDF ✅
- `lib/pdf-exporter.tsx` — componente `InformePDF` con encabezado institucional, cuerpo y pie de página numerado
- `app/api/informes/[id]/pdf/route.ts` — GET devuelve PDF (`application/pdf`) con `Content-Disposition: attachment`; usa `textoFormal` si existe, si no `contenido`
- `components/ReportEditor.tsx` — botón "↓ Exportar PDF" agregado junto a "Formalizar con IA"
- Build limpio ✓
- Ver TASK-INFORME-03

### PC-11: Excepciones del Roll ✅
- `prisma/schema.prisma` — modelo `ExcepcionRoll` + relación en `Colaborador` + `db push` + `generate`
- `app/api/roll/excepciones/route.ts` — GET ?grupoId+semana + POST upsert/delete por tipo
- `app/(admin)/admin/roll/page.tsx` — selector de excepción inline por colaborador, badge coloreado (vacaciones/permiso/ausencia), tachado del nombre
- Build limpio ✓

### PC-12: Vista "Hoy" (Dashboard Diario) ✅
- `ia/01_requirements.md` — Flujo 4 "Vista de Hoy" documentado (origen: audios WhatsApp Eli Daniel 2026-05-29)
- `app/api/roll/hoy/route.ts` — GET sin parámetros → todos los grupos + colaboradores activos agrupados por turno del día actual + excepciones de la semana
- `app/(admin)/admin/hoy/page.tsx` — 3 tarjetas por turno (T1 sky, T2 amber, T3 indigo); colaboradores con excepción aparecen tachados con badge
- `components/AdminNav.tsx` — "Hoy" agregado como primer tab
- `app/(admin)/admin/page.tsx` — redirect actualizado a `/admin/hoy`
- Build limpio ✓ (22 rutas)

## 🔄 En curso — Fase 5: Pulido y Despliegue

### UI mobile-first ✅
- `components/AdminNav.tsx` — reestructurado: fila superior logo+Salir, fila inferior tabs scrollables con indicador activo de borde inferior. Sin desbordamiento en pantallas de 375px.
- `app/(admin)/admin/layout.tsx` — padding reducido en móvil (`px-3 py-4`) y mayor en sm+.
- `app/(admin)/admin/informes/page.tsx` — sidebar cambia a columna en mobile (`flex-col md:flex-row`).
- `app/globals.css` — clase `.scrollbar-none` agregada (scrollbar-width: none + webkit).

### Error handling ✅
- `lib/toast.ts` + `components/Toast.tsx` — sistema de toasts global DOM-event-based
- Todos los `fetch` en páginas admin protegidos con try/catch + `showToast()`

### ISSUE-01: Dirección de rotación corregida ✅
- `lib/roll-engine.ts` — fórmula `+ weeksElapsed` → `- weeksElapsed` (rotación descendente T3→T2→T1→T3)
- Tests actualizados (22/22 ✓)

### ISSUE-07: Modalidades de colaborador (FULL / MT / FIJO) ✅
- `prisma/schema.prisma` — campos `modalidad String @default("FULL")` y `turnoFijo String?` en `Colaborador` + `db push` + `generate`
- `lib/roll-engine.ts` — tipo `Modalidad` + función `getTurnoEfectivo(modalidad, turnoFijo, turnoSemana)`
- `lib/__tests__/roll-engine.test.ts` — 11 nuevos tests FULL/MT/FIJO → 33/33 ✓
- `app/api/roll/hoy/route.ts` — calcula `turnoEfectivo` por colaborador; MT nunca cae en T3
- `app/api/roll/route.ts` — expone `turnoEfectivo` por colaborador en la respuesta
- `app/api/colaboradores/route.ts` + `[id]/route.ts` — aceptan y validan `modalidad` y `turnoFijo`
- `app/(admin)/admin/colaboradores/page.tsx` — select Modalidad + select condicional Turno Fijo + badge en lista
- `app/api/oficial/turno/route.ts` — aplica `getTurnoEfectivo()` para turnoActual y turnoProximo; expone `modalidad`
- `app/(oficial)/oficial/page.tsx` — etiquetas "Mañana/Tarde/Noche" con horario; badge Turno fijo / Turno doble
- Build limpio ✓ / 33 tests ✓

- `lib/__tests__/roll-engine.test.ts` — tests actualizados + 6 tests nuevos de validación contra PDF Eli Daniel
- 17/17 tests en verde ✓, build limpio ✓ (23 rutas)
- `ia/07_issues.md` — documentados ISSUE-01 (resuelto), ISSUE-02 y ISSUE-03 (abiertos)

### ISSUE-04: Etiquetas Mañana/Tarde/Noche en Vista de Hoy ✅
- `admin/hoy/page.tsx` — `TURNO_CONFIG` actualizado: T1=Mañana, T2=Tarde, T3=Noche con sus horarios en el header de cada tarjeta

### ISSUE-05: Campo `puesto` en Colaboradores ✅
- `prisma/schema.prisma` — `puesto String? @db.NVarChar(50)` agregado + `db push` + `generate`
- `api/colaboradores/route.ts` — POST incluye `puesto`
- `api/colaboradores/[id]/route.ts` — PUT incluye `puesto`
- `api/roll/hoy/route.ts` — respuesta incluye `puesto`
- `admin/hoy/page.tsx` — puesto visible bajo el nombre en cada tarjeta de turno
- `admin/colaboradores/page.tsx` — campo "Puesto" en formulario crear/editar; lista muestra `Grupo · Puesto`
- Build limpio ✓ (23 rutas)

- **Origen:** audios WhatsApp + imagen programación Eli Daniel 2026-05-29

### PC-13: Rol Coordinador ✅
- `proxy.ts` — ruta `/coordinador/**` protegida (rol `coordinador`); login redirige al panel correspondiente
- `app/api/usuarios/route.ts` + `[id]/route.ts` — GET lista / POST crear (hash bcrypt cost-12) / PATCH / DELETE (solo admin; auto-borrado bloqueado)
- `app/(admin)/admin/usuarios/page.tsx` — lista de usuarios con badges de rol + formulario crear usuario
- `components/AdminNav.tsx` — enlace "Usuarios" agregado
- `components/CoordinadorNav.tsx` — nav teal con links Hoy + Asistencia
- `app/(coordinador)/layout.tsx` — layout con CoordinadorNav
- `app/(coordinador)/coordinador/hoy/page.tsx` — vista de hoy (todos los grupos) para el coordinador
- `app/(coordinador)/coordinador/asistencia/page.tsx` — asistencia diaria completa para el coordinador
- `types/next-auth.d.ts` — `rol` actualizado para incluir `"coordinador"`
- Build limpio ✓ / 0 errores TS

### PC-14: Tours Guiados (driver.js) ✅
- `npm install driver.js` — instalado en `src/`
- `app/globals.css` — `@import "driver.js/dist/driver.css"` agregado
- `components/TourButton.tsx` — botón `?` azul circular reutilizable; props `steps: DriveStep[]` + `label`; ejecuta `driver({ showProgress, showButtons, ... }).drive()`
- Tours implementados en 10 pantallas (botón `?` en esquina superior derecha de cada una):

  | Pantalla | Pasos | IDs instrumentados |
  |---|---|---|
  | `admin/hoy` | 3 | `hoy-cards`, `hoy-libre` |
  | `admin/asistencia` | 4 | `asistencia-nav`, `asistencia-resumen`, `asistencia-tabla` |
  | `admin/colaboradores` | 3 | `col-btn-nuevo`, `col-lista` |
  | `admin/grupos` | 3 | `grp-btn-nuevo`, `grp-lista` |
  | `admin/roll` | 3 | `roll-filtros`, `roll-resultado` |
  | `admin/informes` | 3 | `informes-sidebar`, `informes-editor` |
  | `admin/usuarios` | 3 | `usuarios-btn-nuevo`, `usuarios-lista` |
  | `coordinador/hoy` | 2 | `coord-hoy-cards` |
  | `coordinador/asistencia` | 4 | `coord-asist-nav`, `coord-asist-resumen`, `coord-asist-tabla` |
  | `oficial` | 3 | `oficial-turno-actual`, `oficial-turno-proximo` |

- 0 errores TypeScript en todos los archivos modificados

### PC-15: Despliegue en producción ✅
- **Plataforma:** VM Azure `demo-itqs` (172.191.128.24) + Docker + nginx + Certbot SSL
- **URL:** https://roll-manager.ezekl.com
- **Imagen:** `roll-manager-green-image:latest` — build `--platform linux/amd64` desde macOS
- **Fixes aplicados durante el deploy:**
  - `lib/auth.ts` — `trustHost: true` agregado (NextAuth v5 requería esto para no lanzar `UntrustedHost`)
  - `src/middleware.ts` — **eliminado** (conflicto con `proxy.ts`; Next.js 16 usa solo `proxy.ts`)
  - `src/Dockerfile` — healthcheck corregido: `localhost` → `127.0.0.1` (Alpine IPv6 bug)
- **Verificación Playwright:** login funciona, redirige a `/admin`, dashboard carga correctamente
- **Container health:** `healthy` ✅
- Ver `ia/07_issues.md` → ISSUE-08, ISSUE-09, ISSUE-10

## ✅ Fase 5 completa
