<!-- File: /PROXIMOS_PASOS.md - v6.0 (Completar Panel de Cliente: Re-reserva y Perfil) -->

# Próximos Pasos: Completar el Panel de Cliente

Este documento define los siguientes objetivos clave del desarrollo, centrados en finalizar las funcionalidades esenciales del panel de cliente para maximizar la retención y la autonomía del usuario.

---

### ✅ **Hito Alcanzado: Ecosistema del Cliente Implementado (v1)**

Se ha finalizado con éxito la implementación de un ciclo de vida completo para el cliente. Los logros clave incluyen:

- **Autenticación de Clientes:** Sistema completo de registro, login y gestión de sesiones.
- **Reservas Flexibles:** La plataforma ahora soporta reservas de usuarios registrados, invitados y nuevos usuarios que se registran durante el proceso.
- **Sistema de Valoraciones Completo:** Automatización de la solicitud de reseñas por Email/WhatsApp con tokens seguros, y un panel de moderación funcional para el administrador.
- **Panel de Cliente (Base):** Implementación de un área de cliente protegida (`/dashboard`) con una página funcional de "Mis Citas".
- **Autogestión de Citas:** Los clientes ahora pueden cancelar sus propias citas desde su panel.

---

### 🎯 **PRÓXIMO OBJETIVO: Implementar la Funcionalidad "Reservar de Nuevo"**

El siguiente paso es añadir una de las funcionalidades de fidelización más importantes: permitir a los clientes volver a reservar un servicio pasado con un solo clic, reduciendo la fricción al mínimo.

La implementación se centrará exclusivamente en el frontend:

1.  **Modificar `CustomerAppointmentsPage.tsx`:**
    - Se añadirá la lógica al botón "Reservar de Nuevo" en las tarjetas de citas del historial.
    - Al hacer clic, la aplicación navegará a la página `/booking`.
    - Se pasarán los datos clave de la cita (como `serviceId` y `employeeId`) a través de parámetros en la URL (ej: `/booking?serviceId=...&employeeId=...`).

2.  **Modificar `BookingPage.tsx`:**
    - Se mejorará el `useEffect` inicial para que detecte la presencia de estos parámetros en la URL al cargar la página.
    - Si los parámetros existen, se usarán para pre-seleccionar automáticamente el profesional en el campo correspondiente, presentando al cliente un flujo de reserva casi completo.

---

### 🚀 **Después de eso: Hito Siguiente - Autogestión Completa del Perfil de Cliente**

Una vez finalizada la re-reserva, completaremos el panel de cliente implementando la gestión del perfil para dar autonomía total al usuario.

La implementación incluirá:

1.  **Backend (`customerProfile.routes.ts` - Nuevo):**
    - Crear un endpoint seguro `PUT /api/me/profile` para que los usuarios actualicen su nombre o teléfono.
    - Crear un endpoint seguro `POST /api/me/change-password` para la gestión de contraseñas.

2.  **Frontend (`CustomerProfilePage.tsx` - Nuevo):**
    - Crear una nueva página con dos formularios: uno para datos personales y otro para el cambio de contraseña.
    - Añadir la ruta correspondiente y el enlace en el menú lateral del `CustomerLayout`.
