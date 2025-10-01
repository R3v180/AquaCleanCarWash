<!-- File: /docs/features/02-public-site.md - v1.0 -->
# 2. Sitio Público y Presentación

## 2.1. Objetivo

Construir la cara visible del negocio. Esta área debe ser visualmente atractiva, profesional, rápida y estar optimizada para convertir visitantes en clientes. Cada página tiene el propósito de informar, generar confianza y guiar al usuario hacia la acción principal: la reserva de una cita.

## 2.2. Desglose de Páginas y Secciones

### Página de Inicio (`/`)

**Propósito:** La primera impresión. Debe captar la atención del usuario en segundos y comunicar el valor y la calidad del servicio.

**Componentes Clave:**

- **Sección "Hero" (Principal):**
  - Un banner de alta calidad (imagen o vídeo) mostrando un coche reluciente.
  - Titular principal claro y potente (ej: "La Excelencia en Cada Detalle").
  - Subtítulo que resuma la propuesta de valor.
  - Botón de Llamada a la Acción (CTA) principal y muy visible: "Reservar Cita Ahora", que dirige al flujo de reserva.
- **Sección de Servicios Destacados:**
  - Una cuadrícula o carrusel mostrando 3-4 de los servicios más populares.
  - Cada servicio mostrará: nombre, imagen, precio base y un botón "Ver Detalles" que lleva a la página de Servicios.
- **Sección "Por Qué Elegirnos":**
  - Iconos y texto breve resaltando 3-4 puntos fuertes: Productos Ecológicos, Técnicos Certificados, Satisfacción Garantizada, etc.
- **Sección de Testimonios:**
  - Un carrusel con 3-5 de las mejores valoraciones de clientes.
  - Cada testimonio mostrará: nombre del cliente, servicio recibido, calificación (estrellas) y un extracto del comentario.
  - Un botón "Leer todas las valoraciones" que enlaza a la página `/reviews`.
- **Footer (Pie de Página):**
  - Información de contacto (teléfono, email), dirección, mapa de ubicación (Google Maps embed), horario de apertura y enlaces a redes sociales.

**Datos Requeridos (API):**

- `GET /api/services?featured=true`
- `GET /api/reviews?limit=5&featured=true`

### Página de Servicios (`/services`)

**Propósito:** Actuar como un catálogo digital detallado que informa y persuade al cliente sobre la oferta del lavadero.

**Componentes Clave:**

- **Listado Completo de Servicios:**
  - Una cuadrícula con todos los servicios disponibles.
  - Cada "tarjeta" de servicio incluirá: imagen, nombre, descripción corta, duración estimada y precio inicial ("Desde X €").
- **Vista Detallada del Servicio (`/services/[slug]` o en un Modal):**
  - Al hacer clic en un servicio, se mostrará:
    - Galería de imágenes "Antes y Después".
    - Descripción completa y detallada del proceso.
    - Lista de "Qué incluye" punto por punto.
    - Tabla de precios por tipo de vehículo (Pequeño, Mediano, Grande/SUV).
    - Un botón CTA destacado: "Reservar este Servicio".

**Datos Requeridos (API):**

- `GET /api/services`
- `GET /api/services/[id]`

### Página "Nuestro Equipo" (`/team`)

**Propósito:** Humanizar la marca, generar confianza y permitir que los clientes elijan a su técnico preferido basándose en su experiencia.

**Componentes Clave:**

- **Perfiles de Empleados:**
  - Una sección para cada técnico.
  - Cada perfil incluirá:
    - Foto profesional y de alta calidad.
    - Nombre y Apellido.
    - Cargo o Especialidad (ej: "Especialista en Detallado y Protección Cerámica").
    - Biografía corta destacando su experiencia y pasión por los coches.
    - Calificación media obtenida de las valoraciones de los clientes.
    - Botón CTA: "Ver Disponibilidad de [Nombre]", que inicia el flujo de reserva con ese empleado ya seleccionado.

**Datos Requeridos (API):**

- `GET /api/employees` (debe devolver el perfil público, incluyendo la valoración media).

### Página de Valoraciones de Clientes (`/reviews`)

**Propósito:** Proveer prueba social masiva y transparente, mostrando las experiencias de otros clientes.

**Componentes Clave:**

- **Resumen de Calificaciones:**
  - Mostrar la calificación media general y el número total de reseñas.
- **Herramientas de Filtrado:**
  - Dropdown para filtrar las valoraciones por servicio específico.
  - Dropdown para filtrar las valoraciones por empleado.
- **Listado de Reseñas:**
  - Lista paginada de todas las reseñas aprobadas.
  - Cada reseña mostrará: nombre del cliente (ej: "Juan G."), calificación en estrellas, servicio recibido, técnico que lo atendió, fecha y el texto completo del comentario.

**Datos Requeridos (API):**

- `GET /api/reviews?approved=true` (con soporte para paginación y filtros: `&serviceId=[ID]`, `&employeeId=[ID]`).

### Página de Tarjetas Regalo (`/gift-cards`)

**Propósito:** Crear una nueva línea de ingresos permitiendo a los usuarios regalar servicios.

**Componentes Clave:**

- **Sección Explicativa:**
  - Título atractivo (ej: "El Regalo Perfecto").
  - Descripción del proceso en 3 pasos: 1. Elige el servicio, 2. Personaliza el regalo, 3. Paga y envía.
- **Formulario de Compra:**
  - Selección del servicio a regalar.
  - Campos para: Nombre del destinatario, Email del destinatario (opcional, se puede enviar al comprador), Nombre del remitente, Mensaje personalizado.
- **Proceso de Pago:**
  - Integración con Stripe para el pago. Al completarse, el backend genera un código de regalo único y envía un email con la tarjeta regalo digital.

**Datos Requeridos (API):**

- `GET /api/services?giftable=true`
- `POST /api/gift-cards`

