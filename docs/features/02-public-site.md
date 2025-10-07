<!-- File: /docs/features/02-public-site.md - v1.1 (ACTUALIZADO) -->

# 2. Sitio Público y Presentación

## 2.1. Objetivo

Construir la cara visible del negocio. Esta área debe ser visualmente atractiva, profesional, rápida y estar optimizada para convertir visitantes en clientes. Cada página tiene el propósito de informar, generar confianza y guiar al usuario hacia la acción principal: la reserva de una cita.

## 2.2. Desglose de Páginas y Secciones

### Página de Inicio (`/`)

**Estado: Implementado.** La página de inicio está funcional y sus botones de llamada a la acción redirigen directamente al flujo de reserva (`/booking`).

**Propósito:** La primera impresión. Debe captar la atención del usuario en segundos y comunicar el valor y la calidad del servicio.

### Página de Servicios (`/services`)

**Estado: Implementado.**

**Propósito:** Actuar como un catálogo digital informativo. Aunque ya no es un paso obligatorio en la reserva, permite a los clientes interesados conocer en detalle los diferentes tratamientos que se han ofrecido o se podrían ofrecer.

**Componentes Clave:**

- **Listado de Servicios:**
  - Una cuadrícula con los servicios. Cada "tarjeta" de servicio incluye: nombre, descripción, duración y precio.

**Datos Requeridos (API):**

- ✅ `GET /api/services`

### Página "Nuestro Equipo" (`/team`)

**Estado: Implementado.**

**Propósito:** Humanizar la marca y generar confianza, presentando al personal que realiza los servicios.

**Componentes Clave:**

- **Perfiles de Empleados:**
  - Una sección para cada técnico con su foto, nombre, cargo y una breve biografía.
- **Llamada a la Acción:**
  - Cada perfil tiene un botón "Ver Servicios" que guía al usuario hacia el flujo de reserva.
- **(Futuro):** El botón podría evolucionar a "Reservar con [Nombre]", pre-seleccionando a ese empleado en la página de booking.

**Datos Requeridos (API):**

- ✅ `GET /api/employees` (Endpoint público).

### Página de Valoraciones de Clientes (`/reviews`)

**Estado: Pendiente.**

**Propósito:** Proveer prueba social masiva y transparente, mostrando las experiencias de otros clientes.

### Página de Tarjetas Regalo (`/gift-cards`)

**Estado: Pendiente.**

**Propósito:** Crear una nueva línea de ingresos permitiendo a los usuarios regalar servicios.
