<!-- File: /PROXIMOS_PASOS.md - v2.0 (Informe de Situación) -->

# Informe de Situación y Próximos Pasos

Este documento describe el estado actual del desarrollo, detalla el bug crítico que bloquea el progreso y define el plan de acción inmediato para resolverlo.

---

### ✅ **Trabajo Realizado (Resumen para Contexto)**

1.  **Gestión de Servicios y Empleados:** Se han implementado CRUDs completos para servicios y empleados, incluyendo estados (`Activo`/`Inactivo`, `Activo`/`Archivado`), horarios semanales por turnos y gestión de ausencias.

2.  **Motor de Disponibilidad (Backend):** La API de disponibilidad (`/api/availability`) ha sido reconstruida para calcular los huecos disponibles basándose en la capacidad combinada de los empleados, sus horarios, ausencias y el horario general del negocio.

3.  **Gestión de Horarios del Negocio (Avanzado):**
    - Se implementó la interfaz para que el administrador configure el horario semanal del negocio.
    - El sistema fue evolucionado para soportar **Anulaciones por Fecha**, permitiendo al administrador configurar tanto **cierres de día completo (festivos)** como **horarios especiales (jornada reducida)**, los cuales tienen prioridad sobre el horario semanal.

4.  **Flujo de Reservas (Backend - Intento de Finalización):** Se implementó la lógica de auto-asignación de empleados en la API `POST /bookings`.

5.  **Sistema de Notificaciones (Base):** Se ha instalado `Nodemailer` y se ha creado la estructura inicial de un `NotificationService` con un sistema de simulación de envío de emails vía Ethereal.

---

### 🔴 **PROBLEMA CRÍTICO ACTUAL (BLOQUEANTE)**

Actualmente, el proyecto se encuentra bloqueado por un bug crítico de inconsistencia en el motor de disponibilidad, conocido como la **"paradoja de la disponibilidad"**.

**Descripción del Bug:**

1.  La API que muestra los huecos al cliente (`GET /api/availability`) llama a la función de validación `isEmployeeAvailable` y determina correctamente que un empleado está disponible para un tramo horario (ej: 09:00), mostrando el hueco en la interfaz. **(Comportamiento Correcto)**.

2.  Sin embargo, al intentar reservar ese mismo hueco, la API de creación de reservas (`POST /bookings`) llama a la **misma función `isEmployeeAvailable`** con los **mismos parámetros**, y esta devuelve `false`, concluyendo erróneamente que el empleado no está disponible.

3.  Esto provoca que la API de reservas devuelva un error `409 Conflict`, bloqueando todas las reservas con auto-asignación y rompiendo el flujo principal de la aplicación.

**Causa Raíz Identificada (Gracias a los Logs):**

Los logs de depuración han confirmado que la contradicción ocurre dentro de la función `isEmployeeAvailable` en el archivo `apps/server/src/lib/availabilityService.ts`. El problema reside en la lógica de comparación de los límites de fecha/hora (ej: `slot.isSameOrAfter(shiftStart)`), que se comporta de manera inconsistente. La misma comparación `09:00 >= 09:00` devuelve `true` en un contexto y `false` en otro, lo que es lógicamente imposible y apunta a un bug muy sutil.

---

### 🎯 **ÚNICO OBJETIVO INMEDIATO: Resolución del Bug**

1.  **Depurar y Corregir `isEmployeeAvailable`:** Iniciar una nueva sesión de desarrollo enfocada exclusivamente en analizar los logs detallados de la función `isEmployeeAvailable` para encontrar la causa raíz de la inconsistencia en la comparación de fechas y aplicar una solución definitiva. El objetivo es que la función devuelva siempre `true` cuando un tramo horario encaja perfectamente en un turno de trabajo.

**Nota:** Todas las demás tareas, incluyendo la finalización del sistema de notificaciones, quedan en pausa hasta que este bug bloqueante sea resuelto.
