# 4. Panel de Cliente

## 4.1. Objetivo

Crear un área privada y segura donde los clientes registrados puedan gestionar su relación con el negocio de forma autónoma. El panel debe proporcionar un valor añadido que fomente el registro y la fidelización, ofreciendo conveniencia, control y acceso a su historial y beneficios.

## 4.2. Desglose de Secciones del Panel

El panel de cliente estará disponible en la ruta `/dashboard` y sub-rutas, y será accesible solo para usuarios autenticados.

### Sección: Mis Citas (`/dashboard/appointments`)

**Propósito:** El centro de operaciones del cliente. Proporciona una visión completa de su historial y sus próximas citas.

**Componentes Clave:**

- **Pestañas de Navegación:** "Próximas Citas" y "Historial de Citas".
- **Vista "Próximas Citas":**
  - Listado de citas pendientes.
  - Cada cita mostrará: Fecha, Hora, Servicio(s), Empleado asignado, Precio.
  - **Acciones por Cita:**
    - **Cancelar Cita:** Botón para solicitar la cancelación. Se aplican reglas de negocio (ej: no se puede cancelar con menos de 24h de antelación). Un modal pedirá confirmación.
    - **Solicitar Cambio:** Botón que abre un modal donde el cliente puede sugerir una nueva fecha/hora. Esto enviará una notificación al administrador para su aprobación manual.
    - **Añadir al Calendario:** Opción para descargar un archivo `.ics`.
- **Vista "Historial de Citas":**
  - Listado de citas completadas.
  - Cada cita mostrará la misma información que las próximas.
  - **Acciones por Cita:**
    - **Reservar de Nuevo:** Botón que inicia el flujo de reserva con el mismo servicio, vehículo y (si está disponible) empleado ya pre-seleccionados.
    - **Dejar Valoración:** Si la cita es reciente y aún no ha sido valorada, se mostrará un botón para escribir una reseña.
    - **Ver Factura:** (Opcional, futuro) Enlace para ver/descargar la factura del servicio.

**API Calls:**

- `GET /api/me/appointments?status=upcoming`
- `GET /api/me/appointments?status=completed`
- `POST /api/me/appointments/[id]/cancel`
- `POST /api/me/appointments/[id]/reschedule-request`

### Sección: Mis Vehículos (`/dashboard/vehicles`)

**Propósito:** Agilizar el proceso de reserva permitiendo al cliente guardar y gestionar la información de sus coches.

**Componentes Clave:**

- **Listado de Vehículos Guardados:**
  - Una vista de "tarjetas" con cada vehículo.
  - Cada tarjeta mostrará: Alias (ej: "Mi Coche"), Marca, Modelo y Tamaño.
- **Acciones:**
  - **Añadir Nuevo Vehículo:** Botón que abre un formulario modal para introducir los datos de un nuevo coche.
  - **Editar/Eliminar:** Opciones en cada tarjeta para modificar los datos o eliminar el vehículo del perfil.

**API Calls:**

- `GET /api/me/vehicles`
- `POST /api/me/vehicles`
- `PUT /api/me/vehicles/[id]`
- `DELETE /api/me/vehicles/[id]`

### Sección: Mis Bonos y Beneficios (`/dashboard/benefits`)

**Propósito:** Dar visibilidad sobre los programas de fidelización y los productos comprados, incentivando su uso.

**Componentes Clave:**

- **Sección de Bonos:**
  - Si el cliente ha comprado bonos (ej: "Bono 5 Lavados Premium"), se listarán aquí.
  - Cada bono mostrará: Nombre del bono, Servicios restantes (ej: "3 de 5 restantes"), Fecha de caducidad (si aplica).
- **Sección de Puntos de Fidelización:**
  - Visualización de los puntos acumulados.
  - Información sobre cómo canjear los puntos (ej: "500 puntos = 1 Lavado Básico Gratis").

**API Calls:**

- `GET /api/me/benefits`

### Sección: Mi Perfil (`/dashboard/profile`)

**Propósito:** Permitir al usuario mantener su información personal actualizada.

**Componentes Clave:**

- **Formulario de Datos Personales:**
  - Campos para editar: Nombre, Apellido, Número de Teléfono.
  - El email se mostrará pero no será editable por ser el identificador principal de la cuenta.
- **Formulario de Cambio de Contraseña:**
  - Campos para: Contraseña Actual, Nueva Contraseña, Confirmar Nueva Contraseña.
  - (Este formulario solo será visible para usuarios registrados con email/contraseña, no para los de OAuth).
- **Gestión de Notificaciones:**
  - Checkboxes para que el usuario elija sus preferencias (ej: "Recibir recordatorios por WhatsApp", "Recibir ofertas por email").

**API Calls:**

- `PUT /api/me/profile`
- `POST /api/me/change-password`
