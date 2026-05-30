# 03 — Plan de Desarrollo

> **Última actualización:** 2026-05-29

## Visión general
Fase 1 completada. Iniciando Fase 2 — CRUD de colaboradores, grupos y motor de rotación.

## Fases del proyecto

### Fase 1 — Setup & Infraestructura Base ✅ Completada
| Componente | Estado |
|------------|--------|
| Inicializar proyecto Next.js 15 + TypeScript | ✅ |
| Configurar Tailwind CSS | ✅ |
| Definir schema Prisma + Azure SQL | ✅ |
| Correr primera migración (`db push`) | ✅ |
| Variables de entorno + `.env.example` | ✅ |
| Configurar NextAuth.js (roles admin/oficial) | ✅ |
| Pantalla de login | ✅ |

### Fase 2 — Módulo Roll de Turnos 🔄 En curso
| Componente | Estado |
|------------|--------|
| CRUD Colaboradores | ⏳ |
| CRUD Grupos | ⏳ |
| Implementar `RollEngine` (lógica de rotación) | ⏳ |
| Vista del roll semanal por grupo | ⏳ |
| Manejo de excepciones por colaborador | ⏳ |
| Vista oficial (su turno actual / próximo) | ⏳ |

### Fase 3 — Módulo Asistencia ⏳ Pendiente
| Componente | Estado |
|------------|--------|
| Vista diaria de asistencia (recuadro) | ⏳ |
| Actualizar estado por colaborador | ⏳ |
| Guardar asistencia en BD | ⏳ |
| Historial de asistencia por colaborador | ⏳ |

### Fase 4 — Módulo Informes + IA + PDF ⏳ Pendiente
| Componente | Estado |
|------------|--------|
| Editor de texto (borrador) | ⏳ |
| Integración Azure AI (formalizar texto) | ⏳ |
| Generación de PDF | ⏳ |
| Historial de informes guardados | ⏳ |

### Fase 5 — Pulido y Despliegue ⏳ Pendiente
| Componente | Estado |
|------------|--------|
| UI mobile-first completa y consistente | ⏳ |
| Manejo de errores y estados de carga | ⏳ |
| Despliegue en Azure App Service / Vercel | ⏳ |
| Pruebas básicas de flujos críticos | ⏳ |
