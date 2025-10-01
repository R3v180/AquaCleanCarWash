# Propuesta y Especificación del Proyecto: AquaClean Car Wash

## 1. Visión del Proyecto

Construir una aplicación web a medida de alto rendimiento que actúe como el motor central del negocio. La plataforma digitalizará por completo la experiencia del cliente, desde la reserva hasta la valoración, y proporcionará al personal herramientas de gestión avanzadas para optimizar las operaciones, automatizar el marketing y potenciar el crecimiento.

## 2. Arquitectura Tecnológica

El proyecto se construirá sobre un stack tecnológico moderno, robusto y escalable, garantizando un desarrollo eficiente y un producto final de máxima calidad.

| Componente            | Tecnología               |
| :-------------------- | :----------------------- |
| **Lenguaje**          | **TypeScript**           |
| **Frontend**          | **React 18 + Vite**      |
| **Librería UI/UX**    | **Mantine UI**           |
| **Backend**           | **Node.js + Express.js** |
| **Base de Datos**     | **PostgreSQL + Prisma**  |
| **Gestión de Estado** | **Zustand**              |
| **Desarrollo**        | **pnpm Monorepo**        |

## 3. Desglose Detallado de Funcionalidades

Esta sección actúa como un índice hacia los documentos de especificación detallada para cada módulo del sistema.

- **Sistema de Autenticación**

  - Flujos de registro, login (email/Google), verificación y recuperación de contraseña.
  - **[Ver especificaciones detalladas en `01-authentication.md`](./features/01-authentication.md)**

- **Sitio Público y Presentación**

  - Detalle de las secciones públicas (Inicio, Servicios, Equipo, Valoraciones, Tarjetas Regalo).
  - **[Ver especificaciones detalladas en `02-public-site.md`](./features/02-public-site.md)**

- **Flujo de Reserva del Cliente**

  - El paso a paso detallado del proceso de reserva online.
  - **[Ver especificaciones detalladas en `03-booking-flow.md`](./features/03-booking-flow.md)**

- **Panel de Cliente**

  - Funcionalidades del área de cliente (Mis Citas, Mis Vehículos, Bonos, Perfil).
  - **[Ver especificaciones detalladas en `04-customer-panel.md`](./features/04-customer-panel.md)**

- **Panel de Administración: Gestión Base**

  - Configuración de Servicios, Empleados, Horarios y Clientes.
  - **[Ver especificaciones detalladas en `05-admin-panel-core-management.md`](./features/05-admin-panel-core-management.md)**

- **Panel de Administración: Operaciones Diarias**

  - Herramientas del día a día (Dashboard, Planning Visual, Gestión de Citas).
  - **[Ver especificaciones detalladas en `06-admin-panel-operations.md`](./features/06-admin-panel-operations.md)**

- **Sistema de Valoraciones**

  - Flujo de solicitud de valoraciones y panel de moderación de reseñas.
  - **[Ver especificaciones detalladas en `07-reviews-system.md`](./features/07-reviews-system.md)**

- **Módulos de Marketing y Monetización**

  - Gestión de bonos, programas de fidelización y suscripciones.
  - **[Ver especificaciones detalladas en `08-marketing-monetization.md`](./features/08-marketing-monetization.md)**

- **Sistema de Notificaciones**

  - Detalle de todos los emails y mensajes de WhatsApp automáticos.
  - **[Ver especificaciones detalladas en `09-notifications-system.md`](./features/09-notifications-system.md)**

- **Integraciones Externas**
  - Especificaciones de la sincronización con Google Calendar y la pasarela de pago Stripe.
  - **[Ver especificaciones detalladas en `10-external-integrations.md`](./features/10-external-integrations.md)**
