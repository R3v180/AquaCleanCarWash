<!-- File: /docs/features/05-admin-panel-core-management.md - v1.1 (ACTUALIZADO) -->

# 5. Panel de Administración: Gestión de la Configuración Base

## 5.1. Objetivo

Proporcionar al administrador del negocio un control total sobre las entidades fundamentales de la plataforma. Esta sección se centra en la configuración "maestra" que define cómo opera el negocio: qué servicios se ofrecen, quién trabaja, cuándo trabajan y cuándo descansan.

## 5.2. Desglose de Secciones

Estas secciones estarán bajo la ruta `/admin` y requerirán un rol de "Administrador".

### Sección: Gestión de Servicios (`/admin/services`)

**Estado: Implementado.** Se ha implementado un CRUD completo para el catálogo de servicios.

**Propósito:** Gestionar los servicios que ofrece el negocio.

**Componentes Clave:**

- **Vista de Listado:**
  - Una tabla que lista todos los servicios creados.
  - Columnas: Nombre, Duración, Precio, **Estado (Activo/Inactivo)**.
  - Acciones por fila: "Editar", "Eliminar" (con modal de confirmación y protección contra borrado si hay citas asociadas).
  - Un `Switch` para cambiar rápidamente el estado `Activo/Inactivo` de un servicio.
- **Formulario de Creación/Edición (en un Modal):**
  - Campos para: Nombre, Descripción, Duración (en minutos), Precio, Categoría y Estado.

**API Calls:**

- ✅ `GET /api/services`
- ✅ `POST /api/services`
- ✅ `PUT /api/services/[id]`
- ✅ `DELETE /api/services/[id]` (con lógica de protección).

### Sección: Gestión de Empleados y Horarios (`/admin/employees`)

**Estado: Implementado.** Se ha implementado una gestión avanzada de los empleados y su disponibilidad.

**Propósito:** Gestionar los perfiles del personal y, fundamentalmente, sus horarios de trabajo y ausencias, que son la base del sistema de disponibilidad.

**Componentes Clave:**

- **Vista de Listado:**
  - Una tabla con todos los empleados, filtrable por estado **(Activos/Archivados)**.
  - Acciones por fila: "Editar", "Archivar" y "Reactivar".
- **Modal de Edición Avanzado (con Pestañas):**
  - **Pestaña "Perfil":** Formulario para datos básicos (Nombre, Email, Rol, Foto, Bio).
  - **Pestaña "Horario Laboral":**
    - Un editor visual para los 7 días de la semana.
    - Permite definir **múltiples turnos de trabajo por día** (ej: para configurar pausas de almuerzo).
  - **Pestaña "Ausencias y Vacaciones":**
    - Un calendario para añadir y visualizar bloqueos de días completos (vacaciones, bajas, etc.).
    - **Sistema de Detección de Conflictos:** Si se intenta programar una ausencia en fechas donde el empleado ya tiene citas, el sistema lo notifica y muestra un modal para resolver el conflicto.

**API Calls:**

- ✅ `GET /api/employees?status=[STATUS]`
- ✅ `POST /api/employees`
- ✅ `PUT /api/employees/[id]` (para perfil, horario y estado).
- ✅ `GET /api/employees/[id]/absences`
- ✅ `POST /api/employees/[id]/absences` (con lógica de detección de conflictos).
- ✅ `DELETE /api/employees/[id]/absences/[id]`

### Sección: Configuración del Negocio (`/admin/settings`)

**Estado: Parcialmente Implementado.** Se ha implementado la lógica para seleccionar el servicio por defecto. La gestión del horario general está pendiente.

**Propósito:** Un panel centralizado para gestionar las configuraciones globales del negocio.

**Componentes Clave:**

- **Selección del Servicio por Defecto:**
  - ✅ Un `Select` que permite elegir cuál de los servicios **activos** se ofrecerá a los clientes.
- **[⏳ Pendiente] Formulario de Horario Semanal del Negocio:**
  - Una interfaz visual para definir las horas de apertura y cierre de la empresa para cada día de la semana.

**API Calls:**

- ✅ `GET /api/admin/settings`
- ✅ `PUT /api/admin/settings`

### Sección: Gestión de Clientes (`/admin/clients`)

**Estado: Pendiente.**

**Propósito:** Un CRM (Customer Relationship Management) simple para tener una visión 360 de cada cliente.
