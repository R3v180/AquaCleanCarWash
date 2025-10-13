<!-- File: /PROXIMOS_PASOS.md - v7.0 (Siguiente Objetivo: Gestión de Vehículos) -->

# Próximos Pasos: Implementar la Gestión de Vehículos

Este documento define el siguiente objetivo clave del desarrollo tras haber completado todas las funcionalidades del ecosistema de cliente y seguridad de la cuenta.

---

### ✅ **Hito Alcanzado: Panel de Cliente y Seguridad de Cuenta Completados**

Hemos finalizado con éxito un bloque de trabajo masivo, dejando la experiencia del cliente y la seguridad de la plataforma en un estado robusto y profesional. Los logros clave son:

- **Panel de Cliente Funcionalmente Completo:**
  - Se implementó la funcionalidad **"Reservar de Nuevo"** para agilizar la recurrencia.
  - Se añadió la sección **"Mi Perfil"**, permitiendo a los clientes actualizar su nombre y cambiar su contraseña de forma autónoma.
  - Se mejoró el **Dashboard del Cliente** con un resumen dinámico que muestra la próxima cita o una llamada a la acción para reservar.

- **Flujos de Seguridad de Cuenta Estándar:**
  - Se implementó un flujo de **verificación de email** obligatorio para todos los nuevos registros.
  - Se construyó un flujo completo de **recuperación de contraseña** ("Contraseña Olvidada").

- **Mejoras de Entorno y Datos:**
  - Se potenció el **Dashboard de Administración** con un nuevo gráfico de "Servicios Populares".
  - Se creó y depuró un **script de `seed`** muy robusto que genera un entorno de demostración completo y realista con un solo comando.

---

### 🎯 **PRÓXIMO OBJETIVO: Implementar la Gestión de "Mis Vehículos"**

El siguiente paso es añadir la última gran funcionalidad prevista para el panel de cliente: permitir a los usuarios guardar y gestionar la información de sus coches. Esto personaliza la experiencia y sienta las bases para futuras funcionalidades, como la selección de vehículo durante la reserva.

La implementación se dividirá en:

1.  **Backend:**
    - Se crearán los endpoints CRUD (Crear, Leer, Actualizar, Eliminar) para vehículos en una nueva ruta segura: `GET, POST, PUT, DELETE /api/me/vehicles`.

2.  **Frontend:**
    - Se creará una nueva página `CustomerVehiclesPage.tsx`.
    - Esta página mostrará una lista de los vehículos guardados por el usuario.
    - Incluirá un botón "Añadir Vehículo" que abrirá un modal con un formulario para los datos del coche (Alias, Marca, Modelo, etc.).
    - Cada vehículo listado tendrá opciones para "Editar" y "Eliminar".

3.  **Integración:**
    - Se añadirá la ruta `/dashboard/vehicles` en `App.tsx`.
    - Se añadirá el enlace "Mis Vehículos" en el menú lateral de `CustomerLayout.tsx`.
