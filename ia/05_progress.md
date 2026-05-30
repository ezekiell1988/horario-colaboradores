# 05 — Progreso del Proyecto

> **Última actualización:** 2026-05-29
> **Fase activa:** Fase 1 — Setup & Infraestructura Base

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

## 🔄 En curso — Fase 1: Setup & Infraestructura Base

### PC-03: NextAuth.js ⏳
- Roles `admin` y `oficial` definidos en arquitectura
- `NEXTAUTH_SECRET` generado y en `.env.local`
- Falta: instalar next-auth, `lib/auth.ts`, login page, middleware, seed
- Ver TASK-SETUP-03

## ⏳ Pendiente — Fases siguientes

| Fase | Descripción | Tasks |
|------|-------------|-------|
| Fase 2 | Roll de turnos | TASK-ROLL-01, 02, 03 |
| Fase 3 | Asistencia diaria | TASK-ASIST-01 |
| Fase 4 | Informes + IA + PDF | TASK-INFORME-01, 02, 03 |
| Fase 5 | Pulido y despliegue | — |
