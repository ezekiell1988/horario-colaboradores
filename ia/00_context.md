# 00 — Contexto del Proyecto

> **Última actualización:** 2026-05-29
> **Scope:** /

## Identidad del proyecto
**Nombre:** Roll Manager
**Propósito:** Gestionar automáticamente el roll de turnos rotativos semanales de colaboradores de seguridad, registrar asistencia diaria y generar informes formales exportables a PDF con apoyo de IA.
**Cliente:** An Allied Universal Company

## Stack tecnológico
| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15 (React, App Router) |
| Backend | Next.js API Routes (Node.js) |
| Lenguaje | TypeScript 5 |
| Base de datos | Azure SQL (MSSQL) |
| ORM | Prisma |
| IA | Azure AI (Azure OpenAI) |
| Autenticación | NextAuth.js v5 |
| PDF | react-pdf / jsPDF |
| Estilos | Tailwind CSS |
| Despliegue | Azure App Service o Vercel |

## Constantes críticas
- Turnos fijos e inmutables: **06:00–14:00** · **14:00–22:00** · **22:00–06:00**
- Rotación **semanal** (cada lunes avanza al siguiente turno en el ciclo)
- Ciclo de turnos: T1 → T2 → T3 → T1 (cada grupo rota de forma independiente)
- Máximo ~20 colaboradores activos
- La app se consume desde el **navegador de un celular** (mobile-first, web)
- Compartir informes: exportar PDF → el usuario abre WhatsApp manualmente

## Roles de usuario
| Rol | Descripción |
|-----|-------------|
| `admin` | Acceso completo: colaboradores, grupos, roll, asistencia, informes |
| `oficial` | Solo lectura: su turno actual y próximo |

## Estructura de carpetas clave
```
/
├── app/                       # Next.js App Router
│   ├── (auth)/                # Login / logout
│   ├── (admin)/               # Panel administrador (protegido)
│   │   ├── colaboradores/     # CRUD de colaboradores
│   │   ├── grupos/            # Gestión de grupos de rotación
│   │   ├── roll/              # Generación y vista del roll semanal
│   │   ├── asistencia/        # Registro de asistencia diaria
│   │   └── informes/          # Editor de informes + IA + PDF
│   └── (oficial)/             # Vista oficial (protegido, solo lectura)
├── components/                # Componentes React reutilizables
├── lib/                       # Prisma client, Azure AI client, helpers
├── prisma/
│   └── schema.prisma          # Modelos y migraciones
├── public/                    # Assets estáticos
└── ia/                        # Documentación LLM del proyecto
```
