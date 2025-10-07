<!-- File: /PROXIMOS_PASOS.md - v1.0 -->

# Próximos Pasos del Desarrollo

Este documento define el plan de acción detallado para completar la implementación de la gestión avanzada de horarios y la actualización del flujo de reservas del cliente.

---

### ✅ **Trabajo Realizado (Resumen para Contexto)**

1.  **Gestión de Servicios:** Se ha implementado un CRUD completo para servicios, incluyendo un sistema de estado `Activo/Inactivo`.
2.  **Gestión de Empleados (Base):** Se ha implementado un CRUD para el perfil de los empleados, con un sistema de estado `Activo/Archivado`.
3.  **Gestión de Tiempo (Empleados):**
    - Se ha creado la API y la interfaz de usuario para gestionar los **horarios semanales** de cada empleado (con múltiples turnos).
    - Se ha implementado la API y la UI para gestionar **ausencias y vacaciones** de forma visual.
    - Se ha desarrollado un sistema de **detección de conflictos** que impide programar una ausencia si existen citas en esas fechas, mostrando un modal de resolución al administrador.
4.  **Motor de Disponibilidad (Backend):** La API de disponibilidad (`/api/availability`) ha sido reconstruida. Ahora es capaz de calcular los huecos disponibles basándose en el horario de un empleado específico o en la capacidad combinada de todos los empleados activos, respetando sus ausencias y el horario general del negocio.

---

### 🎯 **Plan de Acción (Pasos Restantes)**

#### **Fase 1: Completar la Gestión de Horarios (Admin)**

- **Paso 1: Implementar la Interfaz para el Horario del Negocio.**
  - **Objetivo:** Permitir al administrador configurar las horas de apertura y cierre para cada día de la semana.
  - **Archivo Principal a Modificar:** `apps/client/src/pages/admin/BusinessSettingsPage.tsx`.
  - **Tareas:**
    1.  Reemplazar el `Select` actual por un componente visual (`ScheduleEditor` o similar) para gestionar el `weeklySchedule`.
    2.  Asegurar que la API `PUT /api/admin/settings` se actualice para aceptar y guardar estos cambios en el horario.

#### **Fase 2: Finalizar la API de Reservas (Backend)**

- **Paso 2: Implementar la Auto-Asignación de Empleados.**
  - **Objetivo:** Hacer que la API de creación de reservas sea capaz de asignar automáticamente un empleado si el cliente elige la opción "Cualquier Profesional".
  - **Archivo Principal a Modificar:** `apps/server/src/api/bookings.routes.ts`.
  - **Tareas:**
    1.  Modificar el `createBookingSchema` de Zod para que `employeeId` sea opcional.
    2.  En el endpoint `POST /bookings`, añadir la lógica: si `employeeId` no se recibe, buscar un empleado `ACTIVO` que esté disponible en la `startTime` solicitada y asignarlo a la nueva cita. Si no se encuentra ninguno, devolver un error.

#### **Fase 3: Completar el Flujo de Reservas (Cliente)**

- **Paso 3: Realizar un `Commit` para Guardar el Progreso.**
  - **Objetivo:** Consolidar todo el trabajo realizado en el panel de administración antes de pasar a la parte pública final.
  - **Tareas:**
    1.  Crear un mensaje de `commit` detallado que resuma la implementación de la gestión de horarios y ausencias de empleados, incluyendo la detección de conflictos.

#### **Fase 4: Actualización de la Documentación**

- **Paso 4: Sincronizar toda la Documentación con el Estado Actual.**
  - **Objetivo:** Asegurar que los archivos `ROADMAP.md` y `docs/features/*.md` reflejen con precisión todas las funcionalidades que hemos completado.
  - **Archivos a Revisar/Modificar:**
    1.  `ROADMAP.md`: Marcar como completada la "Gestión de Horarios".
    2.  `docs/features/05-admin-panel-core-management.md`: Actualizar la sección de "Gestión de Empleados y Horarios" para reflejar el editor de turnos y el calendario de ausencias.
    3.  `docs/features/03-booking-flow.md`: Actualizar para reflejar el nuevo flujo con selección de empleado.
  - **Propósito:** Proporcionar un contexto claro y preciso para la siguiente sesión de desarrollo.
