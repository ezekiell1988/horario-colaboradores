# 03 — Plan de Desarrollo

> **Última actualización:** 2026-05-30

## Visión general
Fases 1, 2, 3, 4 y buena parte de la 5 completadas. Pendiente: Vista Oficial para FIJO, despliegue y pruebas finales.

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

### Fase 2 — Módulo Roll de Turnos ✅ Completada
| Componente | Estado |
|------------|--------|
| CRUD Colaboradores | ✅ |
| CRUD Grupos | ✅ |
| Implementar `RollEngine` (lógica de rotación) | ✅ |
| Vista del roll semanal por grupo | ✅ |
| Manejo de excepciones por colaborador | ✅ |
| Vista oficial (su turno actual / próximo) | ✅ |
| Modalidades de colaborador (FULL / MT / FIJO) | ✅ |

### Fase 3 — Módulo Asistencia ✅ Completada
| Componente | Estado |
|------------|--------|
| Vista diaria de asistencia (recuadro) | ✅ |
| Actualizar estado por colaborador | ✅ |
| Guardar asistencia en BD | ✅ |
| Historial de asistencia por colaborador | ✅ |

### Fase 4 — Módulo Informes + IA + PDF ✅ Completada
| Componente | Estado |
|------------|--------|
| Editor de texto (borrador) | ✅ |
| Integración Azure AI (formalizar texto) | ✅ |
| Generación de PDF | ✅ |
| Historial de informes guardados | ✅ |

### Fase 5 — Pulido y Despliegue 🔄 En curso
| Componente | Estado |
|------------|--------|
| UI mobile-first completa y consistente | ✅ |
| Manejo de errores y estados de carga | ✅ |
| Vista oficial adaptada a modalidad FIJO | ✅ |
| Despliegue en Azure App Service / Vercel | ⏳ |
| Pruebas básicas de flujos críticos | ⏳ |
