# 03 — Plan de Desarrollo

> **Última actualización:** 2026-05-30

## Visión general
Fases 1–7 completadas en su totalidad. Proyecto en producción en https://roll-manager.ezekl.com con login funcional.

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

### Fase 6 — Modalidad MT_ALTERNO ✅ Completada
> **Origen:** audio8 + imagen calendario Junio 2026 (2026-05-30)

| Componente | Estado |
|------------|--------|
| Migración schema: campo `fechaInicioPersonal` en `Colaborador` | ✅ |
| `roll-engine.ts`: nuevo tipo `MT_ALTERNO` + función `getTurnoPorDia()` | ✅ |
| Tests unitarios `roll-engine` para `MT_ALTERNO` (48/48 ✓) | ✅ |
| CRUD colaboradores: soporte para `MT_ALTERNO` + `fechaInicioPersonal` | ✅ |
| APIs roll y asistencia: lógica diaria para `MT_ALTERNO` | ✅ |
| Vista Asistencia: omitir miércoles para `MT_ALTERNO` | ✅ |
| Vista Oficial: mostrar turno del día (hoy/mañana) para `MT_ALTERNO` | ✅ |

### Fase 7 — Fix deploy producción ✅ Completada
> **Fecha:** 2026-05-30

| Componente | Estado |
|------------|--------|
| Fix `DATABASE_URL`: `172.191.128.24` → `localhost` en VM | ✅ |
| Secret `DATABASE_URL` actualizado en GitHub Actions | ✅ |
| Login `admin@rollmanager.com` verificado en producción | ✅ |

### Fase 8 — Validación con calendario real del cliente ✅ Completada
> **Fecha:** 2026-05-30 — Fuente: imagen calendario Junio 2026 enviada por Eli Daniel

| Componente | Estado |
|------------|--------|
| Lectura del calendario real (imagen WhatsApp, Junio 2026) | ✅ |
| Verificación 1:1 implementación vs calendario (M=T1, T=T2, Libre=Mié) | ✅ |
| Test golden master: 30 días de Junio 2026 cubriendo ciclo A+B completo | ✅ |
| `ia/00_context.md` actualizado con contacto Eli Daniel | ✅ |
| Suite total: 78/78 tests ✓ | ✅ |
