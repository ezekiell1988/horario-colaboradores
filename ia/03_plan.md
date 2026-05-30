# 03 — Plan de Desarrollo

> **Última actualización:** 2026-05-30

## Visión general
Fases 1–4 y Fase 5 completadas en su totalidad. Pendiente: despliegue en producción y pruebas finales.

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

### Fase 5 — Pulido y Despliegue ✅ Completada
| Componente | Estado |
|------------|--------|
| UI mobile-first completa y consistente | ✅ |
| Manejo de errores y estados de carga | ✅ |
| Vista oficial adaptada a modalidad FIJO | ✅ |
| Rol `coordinador` — gestión de asistencia multi-grupo | ✅ |
| Gestión de usuarios (CRUD desde panel admin) | ✅ |
| Tours guiados en todas las pantallas (driver.js) | ✅ |
| Despliegue en VM Azure (Docker + nginx + Certbot) | ✅ |
| Pruebas básicas de flujos críticos (Playwright) | ✅ |

### Fase 6 — Modalidad MT_ALTERNO ⬅ nueva
> **Origen:** audio8 + imagen calendario Junio 2026 (2026-05-30)

| Componente | Estado |
|------------|--------|
| Migración schema: campo `fechaInicioPersonal` en `Colaborador` | ⏳ Pendiente |
| `roll-engine.ts`: nuevo tipo `MT_ALTERNO` + función `getTurnoEfectivoPorDia()` | ⏳ Pendiente |
| Tests unitarios `roll-engine` para `MT_ALTERNO` | ⏳ Pendiente |
| CRUD colaboradores: soporte para `MT_ALTERNO` + `fechaInicioPersonal` | ⏳ Pendiente |
| Vista Hoy (`/admin`): mostrar `MT_ALTERNO` correctamente (por día, no semana) | ⏳ Pendiente |
| Vista Roll (`/admin/roll`): columna por día con Libre en miércoles | ⏳ Pendiente |
| Vista Asistencia: omitir miércoles para `MT_ALTERNO` | ⏳ Pendiente |
| Vista Oficial: mostrar turno del día (no semana) para `MT_ALTERNO` | ⏳ Pendiente |
