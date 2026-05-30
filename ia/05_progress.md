# 05 — Progreso del Proyecto

> **Última actualización:** 2026-05-30
> **Fase activa:** Fase 2 — Módulo Roll de Turnos

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

## 🔄 En curso — Fase 2: Módulo Roll de Turnos

### PC-04: CRUD Colaboradores y Grupos ✅
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
- `components/AdminNav.tsx` — enlace "Roll" agregado
- Build limpio ✓
- Ver TASK-ROLL-03

## ⏳ Pendiente — Fases siguientes

| Fase | Descripción | Tasks |
|------|-------------|-------|
| Fase 2 | Roll de turnos | TASK-ROLL-01, 02, 03 |
| Fase 3 | Asistencia diaria | TASK-ASIST-01 |
| Fase 4 | Informes + IA + PDF | TASK-INFORME-01, 02, 03 |
| Fase 5 | Pulido y despliegue | — |
