// ====== [52] docs/features/03-booking-flow.md ======

<!-- File: /docs/features/03-booking-flow.md - v1.1 (ACTUALIZADO) -->

# 3. Flujo de Reserva del Cliente

## 3.1. Objetivo

Diseñar un proceso de reserva online que sea intuitivo, rápido y sin fricciones. El objetivo es guiar al usuario desde la selección del profesional (opcional) hasta la confirmación de la cita en el menor número de pasos posible, minimizando la tasa de abandono y maximizando las conversiones.

## 3.2. Puntos de Entrada al Flujo

Un usuario puede iniciar el proceso de reserva desde múltiples puntos en la web:

- Botón "Reservar Ahora" en la página de Inicio, que dirige a `/booking`.
- Botón "Reservar Cita" en la cabecera, que dirige a `/booking`.
- (Futuro) Botón "Reservar con [Nombre]" en la página de equipo, que dirigirá a `/booking` con el empleado ya pre-seleccionado.

## 3.3. Desglose del Proceso por Pasos

El flujo se presenta como un asistente multi-paso en la página `/booking`.

### Paso 1: Selección de Profesional (Opcional) y Fecha/Hora

**UI/UX:**

- **Selección de Profesional:**
  - Se muestra un selector (`Select`) que permite al usuario elegir un empleado específico o mantener la opción por defecto: **"Cualquier Profesional"**.
- **Selección de Fecha:**
  - Se muestra un componente de calendario (`DatePicker`).
- **Selección de Hora:**
  - Al cargar la página (y cada vez que se cambia de profesional o de día), se realiza una llamada a la API para obtener los huecos de tiempo disponibles.
  - Se muestra una cuadrícula con los "slots" de tiempo disponibles (ej: 09:00, 10:15, 11:30).
  - El usuario selecciona un slot.
- El botón "Siguiente" se activa una vez se ha seleccionado una fecha y una hora.

**Lógica de Negocio:**

- **Estado: Implementado.** La API de disponibilidad (`/api/availability`) es el cerebro del sistema.
  - Si se selecciona "Cualquier Profesional", la API calcula la capacidad total, fusionando los horarios de todos los empleados activos y restando las citas ya existentes para ofrecer todos los huecos posibles.
  - Si se selecciona un profesional específico, la API calcula la disponibilidad basándose únicamente en el horario y las ausencias de esa persona.

**API Calls:**

- ✅ `GET /api/employees/public` (para poblar el selector de profesionales).
- ✅ `GET /api/availability?date=[YYYY-MM-DD]`
- ✅ `GET /api/availability?date=[YYYY-MM-DD]&employeeId=[ID]`

### Paso 2: Información Personal

**UI/UX:**

- Un formulario (`@mantine/form`) solicita los datos del cliente: Nombre, Email y Número de Teléfono.
- Si el usuario está logueado, estos campos se rellenan automáticamente.
- El botón "Siguiente" se activa cuando todos los campos obligatorios están validados.

### Paso 3: Resumen y Confirmación

**UI/UX:**

- Se muestra un resumen completo y claro de toda la selección:
  - **Servicio:** Nombre del servicio por defecto del negocio.
  - **Cita:** Día, Hora y Profesional asignado (o "Cualquier Profesional").
  - **Tus Datos:** Nombre, email, teléfono.
  - **Total a Pagar.**
- El botón final es "Confirmar Reserva".

**Lógica de Negocio:**

- Al hacer clic en "Confirmar", se envía toda la información a la API de creación de reservas.
- **Estado: Implementado.** La API es capaz de asignar la reserva a un empleado específico. Si el cliente elige "Cualquier Profesional", el backend es capaz de encontrar un empleado disponible y asignárselo automáticamente a la cita.

**API Calls:**

- ✅ `POST /api/bookings`

## 3.4. Flujo Post-Reserva

- **Página de Éxito:**
  - Tras una reserva exitosa, el usuario es redirigido a una página de confirmación.
  - Esta página muestra un mensaje de agradecimiento y resume los detalles de la cita.
- **Notificaciones Automáticas:**
  - **Estado: Pendiente.** El backend disparará las notificaciones correspondientes (email de confirmación al cliente, etc.).
