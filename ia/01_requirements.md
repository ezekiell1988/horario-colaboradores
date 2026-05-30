# 01 — Requisitos del Sistema

> **Última actualización:** 2026-05-29
> **Fuentes:** `ia/assets/nota.txt`, sesión de levantamiento 2026-05-29, audios WhatsApp Eli Daniel 2026-05-29

## Propósito del sistema
Roll Manager gestiona el roll automático de turnos rotativos semanales de colaboradores de seguridad, registra su asistencia diaria y permite generar, editar con IA y exportar informes formales en PDF.

## Reglas fundamentales de negocio
- Los 3 turnos son **fijos e inmutables**: 06:00–14:00, 14:00–22:00, 22:00–06:00.
- La rotación avanza **cada lunes**: T1 → T2 → T3 → T1 (ciclo de 3 semanas).
- Cada **grupo** rota de forma independiente; dos grupos pueden estar en puntos distintos del ciclo.
- Un colaborador pertenece a **un solo grupo** a la vez.
- El sistema nunca debe dejar un turno activo sin al menos un colaborador asignado.
- Solo el **administrador** puede crear/modificar colaboradores, grupos, asistencia e informes.
- Los **oficiales** solo pueden consultar su turno actual y próximo.

## Flujos principales

### Flujo 1 — Generación del Roll Semanal
**Estado de entrada:** Colaboradores y grupos configurados; semana objetivo definida.
**Estado de salida:** Roll generado, visible para el grupo.

1. El admin selecciona el grupo y la semana.
2. El sistema calcula el turno correspondiente según el ciclo y la fecha de inicio del grupo.
3. Se muestra el roll: qué turno le corresponde a cada colaborador cada día de la semana.
4. El admin puede marcar excepciones por colaborador (vacaciones, permiso, ausencia).

### Flujo 2 — Registro de Asistencia Diaria
**Estado de entrada:** Roll del día generado.
**Estado de salida:** Recuadro de asistencia del día completo.

1. El admin abre la vista de asistencia del día actual.
2. Por cada colaborador en turno se muestra:
   - Nombre
   - Turno asignado
   - Puesto / lugar asignado
   - Estado: `presente` / `ausente` / `permiso`
3. El admin actualiza el estado de cada colaborador.
4. El recuadro queda disponible para generar el informe del día.

### Flujo 3 — Generación de Informe Diario con IA
**Estado de entrada:** Borrador de texto escrito por el admin.
**Estado de salida:** PDF formalizado listo para compartir.

1. El admin abre el módulo de informes y escribe el borrador (novedades, eventos, asistencia).
2. Presiona **"Formalizar con IA"** → Azure AI reescribe el texto en tono formal institucional.
3. El admin revisa y edita el resultado libremente.
4. Presiona **"Exportar PDF"** → se descarga el archivo.
5. El admin abre WhatsApp manualmente y comparte el PDF.

## Campos del recuadro de asistencia
| Campo | Tipo |
|-------|------|
| Nombre del oficial | Texto |
| Turno asignado | Enum (T1 / T2 / T3) |
| Puesto / lugar asignado | Texto |
| Estado | Enum (presente / ausente / permiso) |

---

## Flujo 4 — Vista "Hoy" (Dashboard Diario) ⬅ nuevo
> **Origen:** Audios WhatsApp de Eli Daniel (2026-05-29). Requisito central del sistema.

**Estado de entrada:** Al menos un grupo configurado con fechaInicioRotacion.
**Estado de salida:** Pantalla única que muestra, para el día actual, qué colaboradores de **todos los grupos** están en cada turno.

**Descripción:**
El usuario abre la app y ve de inmediato — sin seleccionar nada — una tabla o tarjetas organizadas por turno:

| T1 · 06:00–14:00 | T2 · 14:00–22:00 | T3 · 22:00–06:00 |
|------------------|------------------|------------------|
| Juan, María…     | Rosa, Pedro…     | Ana, Luis…       |

El sistema calcula el turno de cada grupo para la semana de la fecha actual y lista a todos los colaboradores activos (sin excepción ese día) bajo el turno correspondiente.

**Reglas:**
- La fecha de referencia es **hoy** (fecha del servidor, UTC-6 Costa Rica).
- Colaboradores con excepción activa (`vacaciones` / `permiso` / `ausencia`) para esa semana aparecen en su turno pero marcados visualmente como "fuera".
- No se requiere selección de grupo ni semana — la vista es 100% automática.
- Accesible desde el menú principal del admin como primera pantalla tras el login.
- El oficial ve la misma vista pero solo ve su propio nombre (no todos los grupos).

**Pasos del flujo:**
1. Al entrar al panel admin, la ruta `/admin` carga la vista "Hoy".
2. El sistema obtiene todos los grupos activos con sus colaboradores activos.
3. Para cada grupo, calcula el turno de la semana actual con `getTurnoForWeek()`.
4. Agrupa a todos los colaboradores por turno (T1 / T2 / T3).
5. Consulta excepciones de esa semana para resaltarlas.
6. Muestra las tarjetas de turno con los nombres. Sin paginación, sin filtros.
