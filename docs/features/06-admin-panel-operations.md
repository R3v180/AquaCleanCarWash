# 6. Panel de Administración: Operaciones Diarias

## 6.1. Objetivo

Equipar al administrador con las herramientas interactivas necesarias para la gestión del día a día del lavadero. Esta sección se enfoca en la visualización de la actividad, la manipulación de la agenda y el seguimiento de cada cita de forma individual. Es el centro neurálgico para las operaciones en tiempo real.

## 6.2. Desglose de Secciones

### Sección: Dashboard de Analíticas (`/admin/dashboard`)

**Propósito:** La página de inicio del panel de administración. Debe proporcionar una instantánea clara y rápida de la salud y la actividad del negocio.

**Componentes Clave:**

- **Tarjetas de KPIs (Indicadores Clave de Rendimiento):**
  - **Citas para Hoy:** Número total de citas programadas para el día actual.
  - **Ingresos del Día:** Suma de los precios de las citas de hoy.
  - **Ocupación Semanal:** Porcentaje de horas reservadas frente a horas disponibles para la semana en curso.
  - **Nuevos Clientes (Mes):** Número de clientes que se han registrado este mes.
- **Gráficos Visuales (`Chart.js`):**
  - **Reservas por Día:** Un gráfico de barras mostrando el número de citas para cada día de la última semana.
  - **Servicios Más Populares:** Un gráfico de tarta o de barras mostrando el top 5 de servicios más reservados en los últimos 30 días.
- **Actividad Reciente:**
  - Un listado de las 5-10 próximas citas del día.
  - Un feed de las últimas acciones importantes (ej: "Juan Pérez ha cancelado su cita", "Nuevo cliente registrado: María López").

**API Calls:**

- `GET /api/admin/dashboard/kpis`
- `GET /api/admin/dashboard/charts`
- `GET /api/admin/dashboard/activity`

### Sección: Planning Visual (Calendario) (`/admin/planning`)

**Propósito:** La herramienta más importante para la gestión de la agenda. Debe permitir una visualización clara de la carga de trabajo y una manipulación rápida de las citas.

**Componentes Clave:**

- **Integración de `FullCalendar`:**
  - **Vista Semanal por Empleado (Resource Timeline):** La vista por defecto. Muestra los días de la semana en el eje X y los empleados como "recursos" en el eje Y. Las citas aparecen como bloques en la fila del empleado correspondiente.
  - **Otras Vistas:** Botones para cambiar a vista de Día o Mes.
  - **Navegación:** Flechas para avanzar y retroceder por semanas/días.
- **Interactividad:**
  - **Crear Cita Manualmente:** Al hacer clic en un hueco vacío del calendario, se abrirá un modal para crear una nueva cita (ideal para reservas telefónicas).
  - **Ver/Editar Cita:** Al hacer clic en una cita existente, se abrirá un panel lateral (Drawer) o modal con todos los detalles, permitiendo su edición.
  - **Arrastrar y Soltar (Drag & Drop):**
    - **Reagendar:** Arrastrar una cita a otra hora o día para cambiar su fecha.
    - **Reasignar:** Arrastrar una cita de la fila de un empleado a la de otro para cambiar la asignación.
- **Código de Colores:** Las citas pueden tener colores diferentes según su estado (ej: Azul para confirmadas, Verde para completadas, Gris para canceladas).

**API Calls:**

- `GET /api/admin/appointments?start=[DATE]&end=[DATE]` (FullCalendar llama a esta API para obtener los eventos).
- `POST /api/admin/appointments` (para crear citas manualmente).
- `PUT /api/admin/appointments/[id]` (se llama a esta API al soltar una cita después de arrastrarla).

### Sección: Gestión de Citas (`/admin/appointments`)

**Propósito:** Proporcionar una vista de tabla detallada de todas las citas, con potentes herramientas de búsqueda y filtrado para encontrar y gestionar cualquier reserva específica.

**Componentes Clave:**

- **Tabla de Datos Avanzada (`Mantine Data Table`):**
  - **Búsqueda Global:** Un campo de búsqueda para encontrar citas por nombre del cliente, email, teléfono o servicio.
  - **Filtros Avanzados:** Dropdowns para filtrar por:
    - Rango de Fechas.
    - Empleado.
    - Estado de la Cita (Confirmada, Completada, Cancelada, Pendiente de Pago, etc.).
- **Columnas de la Tabla:**
  - ID de Cita, Cliente, Servicio(s), Fecha y Hora, Empleado, Duración, Precio, Estado.
- **Acciones por Fila:**
  - **Ver Detalles:** Abre el mismo panel/modal que desde el calendario.
  - **Cambiar Estado:** Un dropdown para cambiar rápidamente el estado de una cita (ej: marcar como "Completada" al finalizar el servicio).
  - **Reenviar Email de Confirmación:** Un botón para volver a enviar la notificación al cliente.
  - **Gestionar Pago:** Ver el estado del pago de Stripe y realizar acciones (ej: registrar un pago en efectivo si fuera el caso).

**API Calls:**

- `GET /api/admin/appointments` (con todos los parámetros de búsqueda y filtrado).
- `PUT /api/admin/appointments/[id]/status`
