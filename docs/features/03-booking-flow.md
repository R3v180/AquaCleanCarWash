<!-- File: /docs/features/03-booking-flow.md - v1.0 -->
# 3. Flujo de Reserva del Cliente

## 3.1. Objetivo

Diseñar un proceso de reserva online que sea intuitivo, rápido y sin fricciones. El objetivo es guiar al usuario desde la selección del servicio hasta la confirmación de la cita en el menor número de pasos posible, minimizando la tasa de abandono y maximizando las conversiones. La experiencia debe ser excelente en cualquier dispositivo.

## 3.2. Puntos de Entrada al Flujo

Un usuario puede iniciar el proceso de reserva desde múltiples puntos en la web:

- Botón "Reservar Cita Ahora" en la página de Inicio.
- Botón "Reservar este Servicio" en la página de Servicios (con el servicio ya pre-seleccionado).
- Botón "Ver Disponibilidad de [Nombre]" en la página de Nuestro Equipo (con el empleado ya pre-seleccionado).

## 3.3. Desglose del Proceso por Pasos

El flujo se presentará como un asistente multi-paso, preferiblemente dentro de un modal o en una única página (`/booking`) para mantener el contexto. Se utilizará un gestor de estado global (Zustand) para mantener la información de la reserva a través de los pasos.

### Paso 1: Selección de Servicio(s)

**UI/UX:**

- Se muestra una lista de todos los servicios principales. El usuario debe seleccionar uno.
- A continuación, se muestra una lista de "Servicios Adicionales" (add-ons) que el usuario puede añadir opcionalmente (checkboxes).
- Un panel de resumen, visible durante todo el proceso, se actualiza en tiempo real mostrando:
  - Servicios seleccionados.
  - **Duración total estimada** (calculada sumando la duración de todos los servicios).
  - **Coste total estimado.**
- Un botón "Siguiente" se activa una vez se ha seleccionado al menos un servicio principal.

**Lógica de Negocio:**

- El sistema debe sumar correctamente la duración de todos los servicios seleccionados. Este valor (`totalDuration`) es crítico para el siguiente paso.

**API Calls:**

- `GET /api/services` para obtener la lista de servicios, sus duraciones y precios.

### Paso 2: Selección de Empleado y Fecha/Hora

**UI/UX:**

- **Selección de Empleado:**
  - Un dropdown/selector permite al usuario elegir un empleado específico o mantener la opción por defecto: "Cualquier Empleado".
  - Si el flujo se inició desde la página de un empleado, este ya vendrá pre-seleccionado.
- **Selección de Fecha:**
  - Se muestra un componente de calendario (`@mantine/dates`). Los días sin disponibilidad (ej: domingos, festivos) aparecen deshabilitados.
- **Selección de Hora:**
  - Al seleccionar una fecha en el calendario, se realiza una llamada a la API para obtener los huecos disponibles.
  - Se muestra una cuadrícula con los "slots" de tiempo disponibles (ej: 09:00, 09:45, 11:15).
  - Los slots no disponibles o que no tienen suficiente duración para el servicio seleccionado aparecerán deshabilitados o no se mostrarán.
  - El usuario selecciona un slot.
- El botón "Siguiente" se activa una vez se ha seleccionado una fecha y una hora.

**Lógica de Negocio:**

- La API de disponibilidad debe calcular los huecos basándose en el horario del empleado, las citas ya existentes y la `totalDuration` del servicio solicitado.

**API Calls:**

- `GET /api/availability?date=[YYYY-MM-DD]&duration=[MINUTES]&employeeId=[ID_OPCIONAL]`

### Paso 3: Información Personal y del Vehículo

**UI/UX:**

- Un formulario (`@mantine/form`) solicita los datos del cliente.
- **Datos del Cliente:** Nombre, Apellido, Email, Número de Teléfono.
  - Si el usuario está logueado, estos campos se rellenan automáticamente desde su perfil.
- **Datos del Vehículo:** Marca, Modelo, Matrícula (opcional), Tamaño (Pequeño, Mediano, Grande/SUV).
  - Si el usuario está logueado y tiene vehículos guardados, puede seleccionarlos desde un dropdown.
- Un checkbox para aceptar los términos y condiciones del servicio.
- El botón "Siguiente" se activa cuando todos los campos obligatorios están validados.

### Paso 4: Resumen y Confirmación (Pago)

**UI/UX:**

- Se muestra un resumen completo y claro de toda la selección:
  - **Servicios:** Listado y desglose de precios.
  - **Cita:** Día, Hora y Empleado asignado.
  - **Tus Datos:** Nombre, email, teléfono.
  - **Tu Vehículo:** Marca y modelo.
  - **Total a Pagar.**
- Se integra un componente de pago de **Stripe (Payment Element)** para que el usuario introduzca los datos de su tarjeta.
- El botón final, "Confirmar y Pagar", se activa una vez que el formulario de Stripe está completo.

**Lógica de Negocio:**

- El frontend se comunica con Stripe para crear un `PaymentIntent`.
- Al hacer clic en "Confirmar", se procesa el pago. Si el pago es exitoso, se procede a crear la reserva en la base de datos.

**API Calls:**

- `POST /api/payments/create-intent` (para iniciar el pago con Stripe).
- `POST /api/bookings` (se envía toda la información de la reserva, incluido el `paymentIntentId` de Stripe, para crear la cita en la base de datos).

## 3.4. Flujo Post-Reserva

- **Página de Éxito:**
  - Tras una reserva exitosa, el usuario es redirigido a una página de confirmación (`/booking/success`).
  - Esta página muestra un mensaje de agradecimiento, resume los detalles de la cita y le indica al usuario que ha recibido un email de confirmación.
- **Notificaciones Automáticas:**
  - El backend dispara las notificaciones correspondientes: email de confirmación al cliente y notificación a la empresa.

