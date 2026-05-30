# 06 — Decisiones Arquitectónicas (ADRs)

## ADR-01: Next.js 15 como framework full-stack
**Decisión:** Usar Next.js 15 (App Router) como único framework; frontend React + API Routes en el mismo repo.
**Razón:** El cliente consume la app desde un celular vía browser. Next.js elimina la necesidad de un backend separado, simplifica el despliegue a un solo servicio y tiene soporte nativo para TypeScript y Tailwind.
**Alternativas descartadas:**
- React (Vite) + Express separado: dos repos, dos deploys, más complejidad operativa sin beneficio para este tamaño de proyecto.

---

## ADR-02: Prisma ORM sobre cliente MSSQL directo
**Decisión:** Usar Prisma con provider `sqlserver` para acceder a Azure SQL.
**Razón:** Prisma provee tipado automático desde el schema, migraciones versionadas y un cliente singleton seguro para el entorno serverless de Next.js. Reduce errores de SQL manual.
**Alternativas descartadas:**
- `mssql` (driver directo): sin tipado, sin migraciones declarativas, más boilerplate.

---

## ADR-03: Azure AI (Azure OpenAI) para formalización de textos
**Decisión:** Usar Azure OpenAI para el endpoint de formalización de informes.
**Razón:** El cliente ya tiene infraestructura en Azure. Mantener el stack dentro del ecosistema Azure simplifica facturación, seguridad (misma suscripción, RBAC) y latencia.
**Alternativas descartadas:**
- OpenAI directo: requiere cuenta y facturación separada fuera de Azure.
- Modelo local: latencia y costos de infraestructura no justificados para <20 usuarios.

---

## ADR-04: Exportar PDF en lugar de integración nativa con WhatsApp
**Decisión:** La app genera y descarga un PDF; el usuario abre WhatsApp por su cuenta y adjunta el archivo.
**Razón:** La app es web (browser móvil). WhatsApp Business API requiere aprobación, número de empresa y costos recurrentes. La Web Share API no garantiza adjuntar archivos en todos los browsers móviles. Un PDF descargable es universal, sin dependencias externas.
**Alternativas descartadas:**
- `wa.me` con texto: funciona solo para texto plano, no para informes estructurados/formateados.
- WhatsApp Business API: overhead operativo y costo desproporcionados para el caso de uso.

---

## ADR-05: Rotación semanal con fecha de referencia por grupo
**Decisión:** El ciclo de rotación de cada grupo se calcula como `(turnoInicioIndex + semanasDesdeFechaReferencia) % 3`.
**Razón:** Permite que cada grupo tenga su propio punto de inicio en el ciclo sin duplicar lógica. El cálculo es determinista, sin estado acumulado que pueda desincronizarse.
**Alternativas descartadas:**
- Guardar el turno actual en BD y actualizarlo cada lunes con un cron: introduce estado mutable que puede quedar desincronizado si el cron falla.
