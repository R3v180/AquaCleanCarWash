<!-- File: /docs/features/05-admin-panel-core-management.md - v1.0 -->
# 5. Panel de Administración: Gestión de la Configuración Base

## 5.1. Objetivo

Proporcionar al administrador del negocio un control total sobre las entidades fundamentales de la plataforma. Esta sección se centra en la configuración "maestra" que raramente cambia en el día a día, pero que define cómo opera el negocio: qué servicios se ofrecen, quién trabaja, cuándo trabajan y quiénes son los clientes.

## 5.2. Desglose de Secciones

Estas secciones estarán bajo la ruta `/admin` y requerirán un rol de "Administrador".

### Sección: Gestión de Servicios (`/admin/services`)

**Propósito:** Un CRUD (Crear, Leer, Actualizar, Eliminar) completo para el catálogo de servicios.

**Componentes Clave:**

- **Vista de Listado:**
  - Una tabla (`Mantine Data Table`) que lista todos los servicios.
  - Columnas: Nombre, Categoría, Duración (en minutos), Precio Base.
  - Acciones por fila: "Editar", "Eliminar" (con modal de confirmación).
  - Un botón principal: "Añadir Nuevo Servicio".
- **Formulario de Creación/Edición (en un Modal o página dedicada):**
  - **Nombre del Servicio:** Campo de texto.
  - **Descripción:** Editor de texto enriquecido para detalles completos.
  - **Duración:** Campo numérico en minutos. Este valor es **crítico** para el sistema de reservas.
  - **Precios:** Una tabla dinámica para establecer diferentes precios por tamaño de vehículo (ej: Pequeño, Mediano, Grande/SUV).
  - **Categoría:** Selector (ej: Lavado Exterior, Limpieza Interior, Detallado).
  - **Opciones (Checkboxes):**
    - "¿Es un servicio adicional (add-on)?": Si se marca, no aparecerá como servicio principal en el flujo de reserva.
    - "¿Se puede regalar?": Para que aparezca en la sección de Tarjetas Regalo.
    - "¿Destacado en la Homepage?": Para mostrarlo en la página de inicio.
  - **Subida de Imágenes:** Interfaz para subir fotos del "antes y después".

**API Calls:**

- `GET /api/admin/services`
- `POST /api/admin/services`
- `PUT /api/admin/services/[id]`
- `DELETE /api/admin/services/[id]`

### Sección: Gestión de Empleados y Horarios (`/admin/employees`)

**Propósito:** Gestionar los perfiles del personal y, fundamentalmente, sus horarios de trabajo, que son la base del sistema de disponibilidad.

**Componentes Clave:**

- **Vista de Listado:**
  - Tarjetas de perfil para cada empleado con su foto, nombre y rol.
  - Acciones: "Editar Perfil y Horario".
  - Un botón principal: "Añadir Nuevo Empleado".
- **Formulario de Creación/Edición:**
  - **Datos del Perfil:**
    - Nombre y Apellido.
    - Email (será su usuario para acceder al panel si tiene rol de empleado).
    - Rol del Sistema: Dropdown para seleccionar "Administrador" o "Empleado".
    - Biografía Pública: Campo de texto para la página `/team`.
    - Subida de foto de perfil.
  - **Configuración de Horario Semanal:**
    - Una interfaz visual para los 7 días de la semana.
    - Para cada día, el administrador podrá:
      - Marcarlo como "Día Libre".
      - Definir uno o varios turnos de trabajo (ej: Lunes de 09:00 a 13:00 y de 15:00 a 19:00). Esto permite configurar pausas para el almuerzo.
  - **Gestión de Vacaciones/Ausencias:**
    - Un calendario para añadir bloqueos de días completos (ej: "Vacaciones del 1 al 15 de Agosto"). Estos días anularán el horario semanal y el empleado no tendrá disponibilidad.

**API Calls:**

- `GET /api/admin/employees`
- `POST /api/admin/employees`
- `PUT /api/admin/employees/[id]`

### Sección: Gestión de Clientes (`/admin/clients`)

**Propósito:** Un CRM (Customer Relationship Management) simple para tener una visión 360 de cada cliente.

**Componentes Clave:**

- **Vista de Listado:**
  - Una tabla paginada, con capacidad de búsqueda y ordenación.
  - Columnas: Nombre, Email, Teléfono, Fecha de Registro, Nº de Citas Totales.
  - Acción por fila: "Ver Detalles".
- **Vista de Detalles del Cliente (`/admin/clients/[id]`):**
  - **Información de Contacto:** Todos los datos del perfil del cliente.
  - **Historial de Citas:** Un listado completo de todas sus citas (pasadas y futuras).
  - **Vehículos Registrados:** Listado de los coches guardados por el cliente.
  - **Notas Internas:** Un campo de texto **crucial** donde el administrador puede añadir comentarios privados sobre el cliente (ej: "Cliente VIP, ofrecer siempre una botella de agua", "Sensible a los ambientadores fuertes", "Llamó para quejarse el 15/03").

**API Calls:**

- `GET /api/admin/clients` (con soporte para búsqueda, paginación y ordenación).
- `GET /api/admin/clients/[id]`
- `POST /api/admin/clients/[id]/notes`

