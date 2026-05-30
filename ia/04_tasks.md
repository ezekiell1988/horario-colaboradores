# 04 — Tareas Accionables

> **Última actualización:** 2026-05-30
> **Prioridad actual:** Ninguna — proyecto al día

---

## TASK-PUESTO-01: Filtro por área/puesto en asistencia
**Estado:** ✅ Completado

Title: Exponer área permanente del colaborador en la vista de asistencia y agregar filtro por área

Context:
Eli Daniel indicó que ciertos colaboradores (ej. Monitoreo) no rotan de puesto aunque sí de turno.
Se necesita poder filtrar la tabla de asistencia por área para gestionar grupos de puestos fijos.

Changes:
- `api/asistencia/route.ts`: pre-llenar `puesto` en el upsert create con `colaborador.puesto`; exponer `area: r.colaborador.puesto ?? ""` en el map de respuesta.
- `AttendanceTable.tsx`: agregar `area: string` a `AsistenciaRow`; mostrar badge gris bajo el nombre.
- `asistencia/page.tsx`: estado `filtroArea`, chips de filtro dinámicos encima de la tabla, pasar `rowsFiltrados` a `AttendanceTable`.
- `colaboradores/page.tsx`: renombrar label de "Puesto" a "Área / Puesto fijo", placeholder actualizado.

---

## TASK-MT_ALTERNO-01: Migración schema — campo `fechaInicioPersonal`
**Estado:** ✅ Completado

Title: Agregar `fechaInicioPersonal DateTime?` al modelo `Colaborador` en Prisma

Context:
La nueva modalidad `MT_ALTERNO` requiere un ciclo de 2 semanas independiente del grupo.
Se necesita una fecha de referencia propia (lunes) para calcular si la semana actual es Semana A o B.
La modalidad `MT_ALTERNO` también se agrega al esquema como valor válido de `modalidad`.

Steps:
1. En `src/prisma/schema.prisma`, agregar al modelo `Colaborador`:
   ```
   fechaInicioPersonal DateTime?
   ```
2. Ejecutar desde `src/`: `npx prisma db push`
3. Ejecutar: `npx prisma generate`
4. Verificar que build no rompe: `npm run build`

Expected Output:
- Columna `fechaInicioPersonal` disponible en Azure SQL
- `@prisma/client` tipado actualizado

Dependencies: ninguna

---

## TASK-MT_ALTERNO-02: RollEngine — soporte `MT_ALTERNO`
**Estado:** ✅ Completado

Title: Extender `roll-engine.ts` con lógica de cálculo diario para `MT_ALTERNO`

Context:
La modalidad `MT_ALTERNO` no puede calcularse solo con el turno semanal del grupo —
necesita saber el día específico de la semana (0-6) para devolver T1, T2 o "Libre".
Ver especificación completa en `ia/01_requirements.md` sección "Modalidad MT_ALTERNO".

Steps:
1. Agregar `"MT_ALTERNO"` al tipo `Modalidad` en `roll-engine.ts`.
2. Crear función `getTurnoPorDia(modalidad, fechaInicioPersonal, turnoFijo, fecha)`:
   - Si `modalidad !== "MT_ALTERNO"` devuelve `null` (el llamador usa `getTurnoEfectivo`).
   - Si el día de la semana es miércoles (3) → devuelve `"LIBRE"`.
   - Calcular paridad: `semanasDesdeInicio = Math.round((weekStart - fechaInicioPersonal) / MS_PER_WEEK)`.
   - Si par (Semana A): Lun/Mar/Sáb/Dom=T2, Jue/Vie=T1.
   - Si impar (Semana B): Lun/Mar/Sáb/Dom=T1, Jue/Vie=T2.
3. Actualizar `getDiasLibres()`: para `MT_ALTERNO` devolver `[3]` (miércoles).
4. Agregar tests unitarios en `lib/__tests__/roll-engine.test.ts`:
   - Semana A: verificar T2 lunes, T1 jueves, LIBRE miércoles.
   - Semana B: verificar T1 lunes, T2 jueves.
   - Cambio de semana correcto en +1 y +2 semanas.
5. `npm test` — todos los tests pasan.

Expected Output:
- Función `getTurnoPorDia()` exportada.
- `npm test` — 100% passing (mínimo 6 tests nuevos).

Dependencies: TASK-MT_ALTERNO-01

---

## TASK-MT_ALTERNO-03: CRUD Colaboradores — soporte `MT_ALTERNO`
**Estado:** ✅ Completado

Title: Actualizar formulario de colaboradores para crear/editar `MT_ALTERNO` con `fechaInicioPersonal`

Context:
El modal de creación/edición de colaboradores debe mostrar el campo `fechaInicioPersonal` (date picker)
solo cuando la modalidad seleccionada es `MT_ALTERNO`.

Steps:
1. En `app/(admin)/admin/colaboradores/page.tsx`:
   - Agregar `"MT_ALTERNO"` al selector de modalidad.
   - Mostrar input `date` para `fechaInicioPersonal` condicionalmente si `modalidad === "MT_ALTERNO"`.
   - Incluir `fechaInicioPersonal` en el body del POST/PUT.
2. En `app/api/colaboradores/route.ts` y `[id]/route.ts`:
   - Aceptar y persistir `fechaInicioPersonal` (convertir a `Date` antes de Prisma).
3. Validar que si `modalidad === "MT_ALTERNO"` y `fechaInicioPersonal` está vacío → error de validación.
4. `get_errors` sobre archivos modificados. `npm run build` limpio.

Expected Output:
- Se puede crear/editar un colaborador `MT_ALTERNO` con su fecha de inicio personal.
- La BD almacena `fechaInicioPersonal` correctamente.

Dependencies: TASK-MT_ALTERNO-01

---

## TASK-MT_ALTERNO-04: Vistas — adaptar Roll, Hoy y Asistencia
**Estado:** ✅ Completado

Title: Actualizar las tres vistas principales para reflejar el patrón diario de `MT_ALTERNO`

Context:
Las vistas actuales calculan el turno por semana. Para `MT_ALTERNO` el turno varía por día.
- Vista Hoy (`/admin`): debe mostrar el turno del día actual para este colaborador.
- Vista Roll (`/admin/roll`): debe mostrar una columna por día de la semana, con "Libre" el miércoles.
- Vista Asistencia: miércoles no genera registro para `MT_ALTERNO` (es día libre fijo).

Steps:
1. En `app/api/roll/route.ts`: al construir la respuesta, si el colaborador es `MT_ALTERNO`,
   usar `getTurnoPorDia()` para cada día en lugar del turno semanal del grupo.
2. En `app/(admin)/admin/roll/page.tsx`: para `MT_ALTERNO`, mostrar turno por día en la tabla.
   Marcar el miércoles como "Libre" con color verde (igual que excepciones).
3. En `app/api/asistencia/route.ts`: al hacer upsert inicial del día, si el colaborador es
   `MT_ALTERNO` y es miércoles → no crear registro (o marcarlo como `estado: "libre_fijo"`).
4. En `app/(admin)/admin/asistencia/page.tsx`: no mostrar a colaboradores `MT_ALTERNO` en miércoles.
5. `get_errors` sobre archivos modificados. `npm run build` limpio.

Expected Output:
- Vista Hoy muestra `MT_ALTERNO` en T1 o T2 según el día.
- Vista Roll muestra "Libre" verde en miércoles para `MT_ALTERNO`.
- Vista Asistencia omite a `MT_ALTERNO` los miércoles.

Dependencies: TASK-MT_ALTERNO-02, TASK-MT_ALTERNO-03

---

## TASK-MT_ALTERNO-05: Vista Oficial — turno del día para `MT_ALTERNO`
**Estado:** ✅ Completado

Title: Actualizar vista oficial para mostrar el turno del día (no de la semana) cuando la modalidad es `MT_ALTERNO`

Context:
El oficial con modalidad `MT_ALTERNO` tiene turno variable por día dentro de la semana.
La vista actual muestra "turno de la semana" — para este oficial debe mostrar el turno
de hoy y el turno de mañana (no el de la semana próxima).

Steps:
1. En `app/api/oficial/turno/route.ts`: si el colaborador es `MT_ALTERNO`, usar `getTurnoPorDia()`
   para calcular el turno de hoy y el de mañana (en lugar de la semana actual y próxima).
2. En `app/(oficial)/oficial/page.tsx`: si la respuesta incluye `modalidad: "MT_ALTERNO"`,
   cambiar el label de "Esta semana" / "Próxima semana" a "Hoy" / "Mañana".
   Si hoy es miércoles → mostrar "Día libre" en la tarjeta principal.
3. `get_errors`. `npm run build` limpio.

Expected Output:
- El oficial `MT_ALTERNO` ve su turno del día (hoy y mañana), no el semanal.
- Si es miércoles, ve "Día libre" claramente.

Dependencies: TASK-MT_ALTERNO-02, TASK-MT_ALTERNO-03

---

## TASK-GOLDEN-01: Test golden master — calendario real Eli Daniel
**Estado:** ✅ Completado — 2026-05-30

Title: Agregar test `it.each` con los 30 días de Junio 2026 del calendario real

Context:
Eli Daniel (cliente, primo del desarrollador) envió una imagen con el calendario de Junio 2026
mostrando el patrón real de turnos: M=Mañana(T1), T=Tarde(T2), Miércoles=Libre.
Se verificó que la implementación en `roll-engine.ts` coincide 100% con el calendario.

Steps:
1. Agregar `TurnoDia` al import de `roll-engine.test.ts`.
2. Agregar bloque `describe` con `it.each` cubriendo los 30 días de Junio 2026 (15 días laborales x2 semanas = ciclo A+B completo y sus repeticiones).
3. Ejecutar `npx jest roll-engine` → 78/78 tests ✓.

Expected Output:
- Si alguien rompe la lógica de `getTurnoPorDia`, el test detecta exactamente qué fecha falla.

Dependencies: TASK-MT_ALTERNO-02

---

## TASK-SETUP-01: Inicializar proyecto Next.js 15
**Estado:** ✅ Completado

Title: Crear el proyecto base Next.js 15 con TypeScript y Tailwind CSS

Context:
El repositorio existe pero no tiene código. Necesitamos scaffolding del proyecto.

Steps:
1. `npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*"`
2. Verificar que corre con `npm run dev`
3. Limpiar página de ejemplo (`app/page.tsx`)
4. Crear `.env.local` con las variables de entorno del `02_architecture.md` (valores vacíos de placeholder)
5. Crear `.env.example` con los mismos campos documentados

Expected Output:
- Proyecto corre en `localhost:3000`
- `.env.example` en raíz del repo

Dependencies: ninguna

---

## TASK-SETUP-02: Configurar Prisma + Azure SQL
**Estado:** ✅ Completado — Prisma 7 + `@prisma/adapter-mssql` + schema `rm` + 5 tablas en Azure SQL

Title: Instalar Prisma, conectar a Azure SQL y correr la migración inicial

Context:
La base de datos vive en Azure SQL (MSSQL). Prisma necesita el provider `sqlserver`.

Steps:
1. `npm install prisma @prisma/client`
2. `npx prisma init --datasource-provider sqlserver`
3. Copiar el schema del `02_architecture.md` en `prisma/schema.prisma`
4. Configurar `DATABASE_URL` en `.env.local`
5. `npx prisma migrate dev --name init`
6. Crear `lib/prisma.ts` con el cliente singleton

Expected Output:
- `npx prisma studio` abre y muestra las tablas
- `lib/prisma.ts` exporta `prisma`

Dependencies: TASK-SETUP-01

---

## TASK-SETUP-03: Configurar NextAuth.js con roles
**Estado:** ✅ Completado — `lib/auth.ts` + `proxy.ts` + `app/(auth)/login/page.tsx` + `prisma/seed.ts` + `types/next-auth.d.ts`

Title: Autenticación con NextAuth.js v5 — roles admin y oficial

Context:
Necesitamos login con email+contraseña almacenada en Azure SQL. Dos roles: `admin` y `oficial`.

Steps:
1. `npm install next-auth@beta`
2. Crear `lib/auth.ts` con `CredentialsProvider` que valide email+hash contra tabla `User`
3. Incluir `rol` en el JWT y en la sesión (`session.user.rol`)
4. Crear `app/(auth)/login/page.tsx` con formulario de email+contraseña
5. Proteger rutas `/admin/**` (solo `admin`) y `/oficial/**` (solo `oficial`) con middleware
6. Crear seed inicial: `prisma/seed.ts` con un usuario admin de prueba

Expected Output:
- Login funciona; redirige a `/admin` o `/oficial` según rol
- Rutas protegidas devuelven 401 sin sesión

Dependencies: TASK-SETUP-02

---

## TASK-ROLL-01: CRUD Colaboradores y Grupos
**Estado:** ✅ Completado — API Routes + páginas admin con modal, validación de sesión, build limpio

Title: Pantallas de administración para crear y editar colaboradores y grupos de rotación

Context:
El admin necesita registrar colaboradores, asignarlos a grupos y definir la fecha de inicio de rotación de cada grupo.

Steps:
1. API Route `GET/POST /api/colaboradores` y `PUT/DELETE /api/colaboradores/[id]`
2. API Route `GET/POST /api/grupos` y `PUT/DELETE /api/grupos/[id]`
3. Página `app/(admin)/colaboradores/page.tsx` — lista + formulario modal
4. Página `app/(admin)/grupos/page.tsx` — lista + formulario modal con selector de `turnoInicioIndex` y `fechaInicioRotacion`

Expected Output:
- Se pueden crear colaboradores y asignarlos a grupos desde la UI
- Los datos persisten en Azure SQL

Dependencies: TASK-SETUP-03

---

## TASK-ROLL-02: Implementar RollEngine
**Estado:** ✅ Completado — `lib/roll-engine.ts` + `jest.config.ts` + 11 tests pasan (`npm test`)

Title: Lógica pura que calcula el turno de un grupo para cualquier semana dada

Context:
El motor de rotación es el núcleo del sistema. Debe ser determinista y testeable.

Steps:
1. Crear `lib/roll-engine.ts` con la función `getTurnoForWeek(grupo, fechaLunes): "T1"|"T2"|"T3"`
2. Lógica: `index = (grupo.turnoInicioIndex + weeksElapsed) % 3`
3. Función auxiliar `getWeekStart(date): Date` que devuelve el lunes de la semana dada
4. Escribir tests unitarios en `lib/__tests__/roll-engine.test.ts` (al menos 6 casos: ciclo completo + año nuevo + fecha pasada)

Expected Output:
- `getTurnoForWeek` devuelve T1/T2/T3 correcto para inputs conocidos
- Tests pasan con `npm test`

Dependencies: TASK-SETUP-02

---

## TASK-ROLL-03: Vista del Roll Semanal
**Estado:** ✅ Completado — `api/roll/route.ts` + `admin/roll/page.tsx` + link en AdminNav

Title: Pantalla que muestra el roll de la semana seleccionada para un grupo

Context:
El admin debe poder ver y el oficial debe poder ver su turno para cualquier semana.

Steps:
1. API Route `GET /api/roll?grupoId=&fecha=` que usa `RollEngine` y devuelve el roll de la semana
2. Página `app/(admin)/roll/page.tsx` — selector de grupo + semana + tabla de 7 días con turno
3. Página `app/(oficial)/turno/page.tsx` — muestra solo el turno del oficial logueado (semana actual + próxima)
4. Resaltar el día actual en la tabla

Expected Output:
- La tabla muestra correctamente el turno por día para el grupo/semana seleccionados
- El oficial ve únicamente su información

Dependencies: TASK-ROLL-01, TASK-ROLL-02

---

## TASK-ASIST-01: Registro de Asistencia Diaria
**Estado:** ✅ Completado — `api/asistencia/route.ts` + `[id]/route.ts` + `AttendanceTable.tsx` + `admin/asistencia/page.tsx`

Title: Recuadro de asistencia del día con estado editable por colaborador

Context:
Cada día el admin marca quién está presente, ausente o con permiso. Los datos se usan en el informe.

Steps:
1. API Route `GET /api/asistencia?fecha=` — devuelve asistencia del día (crea registros si no existen, con estado `presente` por defecto)
2. API Route `PATCH /api/asistencia/[id]` — actualiza estado, puesto de un registro
3. Componente `components/AttendanceTable.tsx` — tabla con un row por colaborador en turno ese día
4. Página `app/(admin)/asistencia/page.tsx` — fecha seleccionable + `AttendanceTable`

Expected Output:
- El admin puede cambiar el estado de cada colaborador; cambio persiste al recargar
- La tabla solo muestra colaboradores cuyo grupo tiene turno ese día

Dependencies: TASK-ROLL-03

---

## TASK-INFORME-01: Editor de Informes
**Estado:** ✅ Completado — `api/informes/route.ts` + `[id]/route.ts` + `ReportEditor.tsx` + `admin/informes/page.tsx`

Title: Pantalla para escribir y guardar el borrador del informe diario

Context:
El admin escribe novedades del día; el texto se guarda en BD para poder retomarlo.

Steps:
1. API Route `GET/POST /api/informes` y `PUT /api/informes/[id]`
2. Componente `components/ReportEditor.tsx` — textarea con autoguardado (debounce 2s)
3. Página `app/(admin)/informes/page.tsx` — fecha + editor + historial de informes del mes

Expected Output:
- Borrador se guarda automáticamente
- Historial muestra informes anteriores paginados por mes

Dependencies: TASK-SETUP-03

---

## TASK-INFORME-02: Integración Azure AI — Formalizar Texto
**Estado:** ✅ Completado — `lib/azure-ai.ts` + `api/informes/formalizar/route.ts` + botón en ReportEditor

Title: Botón "Formalizar con IA" que reescribe el borrador en tono formal institucional

Context:
Azure AI (Azure OpenAI) recibe el borrador y devuelve una versión formal. El resultado es editable antes de exportar.

Steps:
1. Crear `lib/azure-ai.ts` con función `formalizarTexto(borrador: string): Promise<string>`
2. Prompt del sistema: "Eres un redactor formal de informes de seguridad. Reescribe el siguiente texto en tono formal institucional, manteniendo todos los hechos."
3. API Route `POST /api/informes/formalizar` que llama a `formalizarTexto` y guarda `textoFormal` en BD
4. Agregar botón en `ReportEditor` con estado de carga

Expected Output:
- Al presionar el botón, el área de texto se reemplaza con el texto formalizado en ~5s
- El texto formalizado se guarda en el campo `textoFormal` del informe

Dependencies: TASK-INFORME-01

---

## TASK-INFORME-03: Exportar Informe a PDF
**Estado:** ✅ Completado — `lib/pdf-exporter.tsx` + `api/informes/[id]/pdf/route.ts` + botón en ReportEditor

Title: Generar y descargar el informe como archivo PDF

Context:
El PDF se descarga en el celular y luego el admin lo comparte por WhatsApp manualmente.

Steps:
1. Instalar `@react-pdf/renderer`
2. Crear `lib/pdf-exporter.ts` con template PDF: logo (si existe), fecha, título, cuerpo del informe
3. API Route `GET /api/informes/[id]/pdf` que genera y devuelve el PDF como `application/pdf`
4. Agregar botón "Exportar PDF" en la página de informes; trigger descarga directa

Expected Output:
- El PDF se descarga con nombre `informe-{fecha}.pdf`
- El PDF contiene el texto formalizado (o el borrador si no fue formalizado)

Dependencies: TASK-INFORME-02

---

## TASK-ROLL-MODALIDAD: Soporte de 3 modalidades de colaborador
**Estado:** ⏳ Pendiente

Title: Implementar las modalidades FULL, MT (turno doble) y FIJO (T1 o T2 fijo)

Context:
Confirmado por Eli Daniel (2026-05-30). Existen 3 tipos:
- `FULL` — Ciclo completo Mañana+Tarde+Noche (ya implementado como default)
- `MT` — Solo Mañana+Tarde. Cuando el grupo cae en T3, estos colaboradores permanecen en T2.
- `FIJO_T1` — Siempre Mañana (06:00–14:00), sin ciclo.
- `FIJO_T2` — Siempre Tarde (14:00–22:00), sin ciclo.

Steps:
1. **Schema Prisma** — Agregar a `Colaborador`:
   - `modalidad String @default("FULL") @db.NVarChar(10)` — valores: `"FULL"` | `"MT"` | `"FIJO"`
   - `turnoFijo String? @db.NVarChar(2)` — `"T1"` | `"T2"` | `null` (solo usado cuando `modalidad = "FIJO"`)
   - Correr `npx prisma db push` desde `src/`
   - Correr `npx prisma generate`
2. **RollEngine** (`lib/roll-engine.ts`) — Nueva función:
   ```ts
   export function getTurnoEfectivo(modalidad: string, turnoFijo: string | null, turnoSemana: Turno): Turno {
     if (modalidad === "FIJO" && turnoFijo) return turnoFijo as Turno;
     if (modalidad === "MT" && turnoSemana === "T3") return "T2"; // no trabajan de noche
     return turnoSemana;
   }
   ```
3. **API `/api/roll/hoy`** — Usar `getTurnoEfectivo()` por cada colaborador antes de asignarlo a `turnos[turno]` o `libre[]`.
4. **API `/api/roll`** — Igual: usar `getTurnoEfectivo()` al generar la vista semanal.
5. **API `/api/colaboradores`** — Incluir `modalidad` y `turnoFijo` en GET/POST/PUT.
6. **UI `/admin/colaboradores`** — Agregar en el formulario:
   - Select "Modalidad": Mixto / Doble (M+T) / Fijo
   - Si "Fijo": mostrar select "Turno fijo": Mañana / Tarde
7. **Tests** — Agregar casos en `roll-engine.test.ts`:
   - MT en semana T3 → devuelve T2
   - FIJO_T1 en cualquier semana → siempre T1
   - FIJO_T2 en semana T3 → siempre T2

Expected Output:
- Un colaborador MT nunca aparece en Noche en la Vista de Hoy
- Un colaborador FIJO siempre aparece en el mismo turno independientemente de la semana del grupo
- El formulario de colaboradores permite seleccionar la modalidad
- 22 + 7 = mínimo 29 tests passing

Dependencies: PC-05 (RollEngine), TASK-ROLL-03
