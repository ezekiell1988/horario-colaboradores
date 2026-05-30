# 02 — Arquitectura del Sistema

> **Última actualización:** 2026-05-29
> **Scope:** Roll Manager — Next.js 15 + Azure SQL

## Pipeline principal

```
Celular (browser)
      │  HTTPS
      ▼
┌─────────────────────────────────────┐
│         Next.js 15 App              │
│  ┌──────────────┐  ┌─────────────┐  │
│  │  React UI    │  │  API Routes │  │
│  │  App Router  │  │  /api/**    │  │
│  └──────────────┘  └──────┬──────┘  │
│       NextAuth.js         │         │
│       (JWT session)       │         │
└───────────────────────────┼─────────┘
                            │
              ┌─────────────┴──────────────┐
              │                            │
              ▼                            ▼
       Prisma ORM                   Azure AI
              │                    (OpenAI)  
              ▼                    formalizar texto
       Azure SQL
       (MSSQL)

PDF flow:
  API Route → react-pdf/jsPDF → blob → descarga en browser
```

## Componentes clave
| Componente | Responsabilidad | Archivo |
|------------|-----------------|--------|
| `RollEngine` | Calcula turno de un grupo para una semana dada | `lib/roll-engine.ts` |
| `AttendanceTable` | Grid de asistencia diaria editable | `components/AttendanceTable.tsx` |
| `ReportEditor` | Editor de texto con botón "Formalizar con IA" | `components/ReportEditor.tsx` |
| `PDFExporter` | Genera PDF descargable del informe | `lib/pdf-exporter.ts` |
| `AzureAIClient` | Wrapper para llamadas a Azure OpenAI | `lib/azure-ai.ts` |
| `prisma` | Cliente Prisma singleton | `lib/prisma.ts` |
| `auth` | Configuración NextAuth.js (roles: admin/oficial) | `lib/auth.ts` |

## Esquema de base de datos (Prisma)

```prisma
model Colaborador {
  id        String   @id @default(cuid())
  nombre    String
  activo    Boolean  @default(true)
  grupoId   String
  grupo     Grupo    @relation(fields: [grupoId], references: [id])
  asistencias Asistencia[]
  user      User?
}

model Grupo {
  id                  String   @id @default(cuid())
  nombre              String
  turnoInicioIndex    Int      // 0=T1, 1=T2, 2=T3
  fechaInicioRotacion DateTime // lunes de referencia para el ciclo
  colaboradores       Colaborador[]
}

model Asistencia {
  id             String      @id @default(cuid())
  colaboradorId  String
  colaborador    Colaborador @relation(fields: [colaboradorId], references: [id])
  fecha          DateTime    // solo fecha, sin hora
  turno          String      // "T1" | "T2" | "T3"
  puesto         String
  estado         String      // "presente" | "ausente" | "permiso"
}

model Informe {
  id             String   @id @default(cuid())
  fecha          DateTime
  textoBorrador  String
  textoFormal    String?
  exportadoAt    DateTime?
  creadoPor      String   // userId del admin
}

model User {
  id             String      @id @default(cuid())
  email          String      @unique
  passwordHash   String
  rol            String      // "admin" | "oficial"
  colaboradorId  String?     @unique
  colaborador    Colaborador? @relation(fields: [colaboradorId], references: [id])
}
```

## Lógica del RollEngine

```
turnoActual(grupo, fechaSemana):
  semanasDesdInicio = floor((fechaSemana - grupo.fechaInicioRotacion) / 7 días)
  index = (grupo.turnoInicioIndex + semanasDesdInicio) % 3
  return ["T1","T2","T3"][index]

Turnos:
  T1 = 06:00–14:00
  T2 = 14:00–22:00
  T3 = 22:00–06:00
```

## Variables de entorno requeridas
```
DATABASE_URL             # Connection string Azure SQL (Prisma)
NEXTAUTH_SECRET          # JWT secret
NEXTAUTH_URL             # URL pública de la app
AZURE_OPENAI_ENDPOINT    # Endpoint Azure OpenAI
AZURE_OPENAI_API_KEY     # API key Azure OpenAI
AZURE_OPENAI_DEPLOYMENT  # Nombre del deployment (ej: gpt-4o)
```
