# Instrucciones del proyecto — Roll Manager

## Stack

- **Framework:** Next.js 16 (App Router, TypeScript, Tailwind CSS)
- **Base de datos:** Azure SQL Server vía Prisma 7 + `@prisma/adapter-mssql`
- **Autenticación:** NextAuth.js v5 (beta) — CredentialsProvider, JWT, roles `admin`/`oficial`
- **IA:** Azure OpenAI (AI Foundry) — deployment `gpt-5.5`
- **Directorio raíz del proyecto:** `src/` (no en la raíz del repo)

## Reglas generales

- Todo comando `npm`, `npx prisma`, etc. debe ejecutarse desde `src/`.
- El cliente Prisma usa driver adapter (`PrismaMssql`) — no instanciar `PrismaClient` sin él.
- Las variables de entorno para Next.js van en `src/.env.local`; las del CLI de Prisma en `src/.env`.

## Al crear páginas o componentes

1. **Revisar errores con el skill `angular-upgrade`** tras crear cualquier página o componente.
   - Aunque el proyecto es Next.js, el skill cubre TypeScript strict, accesibilidad (labels, aria) y reglas de linting que aplican igual.
   - Ejecutar `get_errors` sobre cada archivo nuevo antes de dar la tarea por terminada.
2. Los `<label>` deben tener `htmlFor` vinculado al `id` del `<input>` correspondiente.
3. Los `target="_blank"` deben incluir `rel="noopener noreferrer"`.
4. No usar estilos inline — usar clases Tailwind.
5. Los Server Components son el default; agregar `"use client"` solo cuando se necesite estado o eventos del navegador.

## Seguridad

- No exponer `DATABASE_URL`, `NEXTAUTH_SECRET` ni `AZURE_OPENAI_API_KEY` al cliente.
- Variables públicas de Next.js deben llevar el prefijo `NEXT_PUBLIC_`.
- Todas las rutas de API deben validar la sesión antes de operar sobre la BD.
