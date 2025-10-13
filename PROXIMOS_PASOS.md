<!-- File: /PROXIMOS_PASOS.md - v4.0 (Ecosistema del Cliente) -->

# Próximos Pasos: Hacia una Experiencia de Cliente Completa

Este documento define el siguiente gran objetivo de desarrollo: la implementación de un ecosistema completo para el cliente, desde una reserva flexible hasta la valoración del servicio y la gestión de ausencias ("no-shows").

---

### ✅ **Hito Alcanzado: Flujo de Reserva y Notificaciones Funcional**

Se ha finalizado y validado el flujo de reserva principal, incluyendo las notificaciones automáticas por email y WhatsApp, y los recordatorios de cita 24 horas antes. El MVP de operaciones (`v1.0`) se considera completo.

---

### 🎯 **PRÓXIMO GRAN OBJETIVO: Implementar el Ecosistema Completo del Cliente**

El objetivo es evolucionar la plataforma para gestionar todo el ciclo de vida de la relación con el cliente, ofreciendo flexibilidad, fomentando la fidelización y proporcionando al negocio herramientas para gestionar la calidad del servicio y la rentabilidad.

Dividiremos este objetivo en 4 fases lógicas y secuenciales:

### Fase 1: La Fundación - Base de Datos y Autenticación

**Meta:** Preparar la infraestructura de la base de datos y la autenticación de clientes para soportar los nuevos flujos de trabajo.

1.  **Modificar el Esquema de la Base de Datos (`apps/server/prisma/schema.prisma`):**
    - En el modelo `Appointment`, hacer la relación `userId` opcional (`String?`) y añadir campos para reservas de invitados: `guestName: String?`, `guestEmail: String?`, `guestPhone: String?`.
    - En el `enum AppointmentStatus`, añadir el nuevo estado `NO_SHOW`.
    - Crear un nuevo modelo `Review` para almacenar las valoraciones, con campos como `rating`, `comment`, `status`, y la relación a la `Appointment`.
    - Crear un nuevo `enum ReviewStatus` con los valores `PENDING`, `APPROVED`, `HIDDEN`.

2.  **Crear el Sistema de Autenticación para Clientes:**
    - Crear las rutas de la API (`apps/server/src/api/customerAuth.routes.ts`) para el registro y login de clientes.
    - Crear las páginas de UI en el cliente (`apps/client/src/pages/public/LoginPage.tsx` y `RegisterPage.tsx`).

### Fase 2: El Flujo del Cliente - Reserva Flexible

**Meta:** Permitir que los clientes reserven tanto como invitados como creando una cuenta, mejorando la conversión.

1.  **Actualizar el Flujo de Reserva (`apps/client/src/pages/public/BookingPage.tsx`):**
    - En el paso de "Tus Datos", añadir un `Checkbox`: _"Crear una cuenta para gestionar mis citas"_.
    - Si se marca, mostrar un campo adicional para la contraseña.
2.  **Adaptar la Lógica de Creación de Reservas (`apps/server/src/api/bookings.routes.ts`):**
    - Modificar el endpoint `POST /bookings` para que maneje dos casos:
      - Si el usuario está creando una cuenta, primero crea el `User` y luego la `Appointment` vinculada.
      - Si reserva como invitado, guarda los datos en los campos `guestName`, `guestEmail`, etc., de la `Appointment`, dejando `userId` nulo.

### Fase 3: El Flujo del Administrador - Gestión del Ciclo de Vida de la Cita

**Meta:** Dar al administrador las herramientas para gestionar el estado final de una cita, lo que actuará como disparador para el flujo post-servicio.

1.  **Actualizar el Formulario de Citas del Admin (`apps/client/src/components/admin/AppointmentForm.tsx`):**
    - Añadir un `Select` o botones para cambiar el estado de la cita. Las opciones relevantes serán "Marcar como Completada" (`COMPLETED`) y "Marcar como No Presentado" (`NO_SHOW`).
2.  **Crear Endpoint de Actualización de Estado (`apps/server/src/api/adminAppointments.routes.ts`):**
    - Crear o modificar un endpoint (ej: `PUT /admin/appointments/:id/status`) que permita al administrador cambiar el estado de una cita.
    - Esta acción será el **trigger** para el sistema de notificaciones y valoraciones.

### Fase 4: El Cierre del Ciclo - Solicitud de Valoración y Moderación

**Meta:** Automatizar la solicitud de feedback y dar al administrador el control sobre la reputación online.

1.  **Crear la Notificación Post-Servicio (`apps/server/src/lib/notificationService.ts`):**
    - Crear una nueva función `sendReviewRequest()`.
    - Esta función se llamará automáticamente cuando una cita pase al estado `COMPLETED`.
    - Enviará un email/WhatsApp al cliente con un enlace único para dejar su valoración.
2.  **Construir el Flujo de Valoración:**
    - Crear la página pública para enviar la valoración (`apps/client/src/pages/public/ReviewPage.tsx`).
    - Crear el endpoint en el backend (`apps/server/src/api/reviews.routes.ts`) para recibir y guardar la valoración en la base de datos con estado `PENDING`.
3.  **Construir el Panel de Moderación de Reseñas:**
    - Crear una nueva página en el panel de admin (`apps/client/src/pages/admin/ReviewsManagementPage.tsx`).
    - Mostrará todas las reseñas `PENDING` y permitirá al admin "Aprobarlas" o "Ocultarlas".
    - Crear los endpoints de la API correspondientes para esta gestión.
