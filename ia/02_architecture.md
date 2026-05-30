# 02 — Arquitectura del Sistema

> **Última actualización:** 2026-05-30
> **Scope:** Roll Manager — Next.js 15 + Azure SQL + VM Azure + Cloudflare

## Infraestructura de producción

### VM Azure `demo-itqs`

| Campo | Valor |
|-------|-------|
| Proveedor | Azure — Suscripción `Sponsorship-DEV-ITQS` |
| Grupo de recursos | `rg-ezequiel` |
| IP pública | `172.191.128.24` |
| OS | Ubuntu 24.04.3 LTS |
| Tamaño | Standard_DS1_v2 (1 vCPU, 3.5 GB RAM) |
| Docker | 29.1.0 |
| nginx | 1.24.0 (TLS gestionado por Certbot) |
| SSH | `ssh -i credentials/id_rsa.pem azureuser@172.191.128.24` |

### DNS — Cloudflare

| Campo | Valor |
|-------|-------|
| Dominio | `ezekl.com` |
| Zone ID | `1ab102a0434b960afd1ff5543c09c9cd` |
| Token | `credentials/dns-token.txt` |
| Registro A | `roll-manager.ezekl.com → 172.191.128.24` |
| Modo | **DNS-only (`proxied=false`)** — requerido para SSL con Certbot |

> ⚠️ **Crítico:** el registro DNS **debe** tener `proxied=false` (nube gris). Si se activa el proxy de Cloudflare, Certbot falla al renovar/emitir el certificado SSL (HTTP-01 challenge bloqueado).

### Contenedor de producción

```
roll-manager-green
  imagen : roll-manager-green-image:latest
  puerto : 127.0.0.1:3000:3000  (solo accesible desde nginx, no expuesto públicamente)
  .env   : ~/projects/roll-manager/.env  (chmod 600)
  restart: unless-stopped
```

El flujo de tráfico es:

```
Internet (HTTPS 443)
      │
      ▼
Cloudflare DNS (DNS-only)
      │
      ▼
nginx en VM (TLS Certbot — cert válido hasta 2026-08-28)
      │  proxy_pass http://127.0.0.1:3000
      ▼
Docker container roll-manager-green (Next.js, puerto 3000)
      │
      ├─── Prisma ORM ──► Azure SQL (sqlserveritqsdemos.database.windows.net)
      └─── Azure OpenAI ──► gpt-5.5
```

## Pipeline de la aplicación

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
