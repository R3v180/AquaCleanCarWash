// ====== [58] docs/features/03-booking-flow.md ======

<!-- File: /docs/features/03-booking-flow.md - v1.3 (Funcional) -->

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

- **Estado: Implementado.** La API de disponibilidad (`GET /api/availability`) lee el inventario de citas disponibles y funciona correctamente.

**API Calls:**

- ✅ `GET /api/employees/public`
- ✅ `GET /api/availability?date=[YYYY-MM-DD]`
- ✅ `GET /api/availability?date=[YYYY-MM-DD]&employeeId=[ID]`

### Paso 2: Información Personal

**UI/UX:**

- Un formulario (`@mantine/form`) solicita los datos del cliente: Nombre, Email y Número de Teléfono.
- El botón "Siguiente" se activa cuando todos los campos obligatorios están validados.

### Paso 3: Resumen y Confirmación

**UI/UX:**

- Se muestra un resumen completo y claro de toda la selección.
- El botón final es "Confirmar Reserva".

**Lógica de Negocio:**

- Al hacer clic en "Confirmar", se envía toda la información a la API de creación de reservas.
- **Estado: Implementado.** El backend busca un hueco disponible que coincida con la selección y lo actualiza con los datos del cliente, cambiando su estado a `CONFIRMED`.

**API Calls:**

- [✅] `POST /api/bookings` <!-- LÍNEA MODIFICADA -->

## 3.4. Flujo Post-Reserva

- **Página de Éxito:**
  - Funcional.
- **Notificaciones Automáticas:**
  - **Estado: Implementado (base).** La lógica de envío está lista y se integra con Ethereal para simulación.
