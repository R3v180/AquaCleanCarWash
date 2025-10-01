````markdown
# 7. Sistema de Valoraciones y Reseñas

## 7.1. Objetivo

Implementar un ciclo de feedback completo que permita recopilar valoraciones de los clientes de forma automatizada y utilizar esas reseñas como una potente herramienta de marketing y prueba social. El sistema debe dar al administrador control total sobre qué valoraciones se muestran públicamente.

## 7.2. Flujo del Cliente para Dejar una Valoración

El proceso está diseñado para ser lo más simple y proactivo posible, maximizando la tasa de respuesta.

1.  **Disparador (Trigger):** Un administrador cambia el estado de una cita a "Completada" en el panel de administración.
2.  **Espera Programada:** El sistema espera un tiempo configurable (ej: 3 horas) para dar tiempo al cliente a disfrutar del resultado antes de pedirle una opinión.
3.  **Notificación Automática:** Pasado el tiempo de espera, se envía un email y/o un mensaje de WhatsApp al cliente.
    - El mensaje agradece su visita.
    - Incluye una llamada a la acción clara, como "Valora tu experiencia en 1 minuto".
    - Proporciona dos enlaces:
      - **Enlace principal:** Un link seguro, único y de un solo uso que dirige a la página de valoración del propio sitio web.
      - **Enlace secundario (opcional):** Un enlace directo para dejar una reseña en el perfil de Google Business de la empresa.
4.  **Página de Valoración:**
    - Al hacer clic en el enlace principal, el usuario llega a una página simple y sin distracciones.
    - La página ya sabe de qué cita se trata gracias al token en la URL.
    - **Formulario:**
      - **Calificación General (Estrellas):** Un selector de 1 a 5 estrellas (obligatorio).
      - **Comentario:** Un área de texto para que el cliente escriba su opinión (opcional).
      - **Calificación del Empleado (Opcional):** Si se desea, se puede añadir un segundo selector de estrellas para valorar específicamente al técnico que le atendió.
    - **Envío:** Al enviar, la valoración se guarda en la base de datos con el estado inicial de **"Pendiente"**.

## 7.3. Panel de Moderación para el Administrador (`/admin/reviews`)

**Propósito:** Dar al dueño del negocio el control total sobre la reputación online que se muestra en su propia web.

**Componentes Clave:**

- **Vista Principal:**
  - Una vista de "bandeja de entrada" con todas las valoraciones recibidas, ordenadas por fecha (las más recientes primero).
  - Filtros para ver reseñas por estado: "Pendientes", "Aprobadas", "Ocultas".
- **Tarjeta de Valoración Individual:**
  - Cada valoración pendiente se muestra claramente con toda su información:
    - Nombre del Cliente.
    - Servicio recibido.
    - Empleado que lo atendió.
    - Fecha de la cita.
    - Calificación en estrellas.
    - Texto completo del comentario.
- **Acciones de Moderación:**
  - **Aprobar:** Cambia el estado a "Aprobada". La valoración será ahora visible en las secciones públicas de la web.
  - **Ocultar:** Cambia el estado a "Oculta". La valoración se guarda para registros internos y analíticas, pero **no será visible públicamente**. No se elimina.
  - **Destacar (Checkbox/Toggle):** Una opción adicional en las reseñas aprobadas para marcarlas como "Destacadas" y que aparezcan en la página de inicio.

## 7.4. Modelo de Datos (Esquema Prisma)

```prisma
model Review {
  id            String      @id @default(cuid())
  rating        Int         // Calificación de 1 a 5
  comment       String?     @db.Text
  status        ReviewStatus @default(PENDING) // PENDING, APPROVED, HIDDEN
  isFeatured    Boolean     @default(false)    // Para la homepage

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  // Relaciones
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  appointmentId String      @unique // Cada cita solo puede tener una reseña

  user          User        @relation(fields: [userId], references: [id])
  userId        String

  employee      Employee    @relation(fields: [employeeId], references: [id])
  employeeId    String
}

enum ReviewStatus {
  PENDING
  APPROVED
  HIDDEN
}
```
````

## 7.5. Endpoints de la API

- `GET /api/reviews/request?token=[TOKEN]`: Valida el token de un solo uso y muestra la página/formulario para dejar la valoración.
- `POST /api/reviews?token=[TOKEN]`: Endpoint para que el cliente envíe su valoración. Valida el token antes de guardar los datos.
- `GET /api/reviews`: Endpoint público que devuelve todas las reseñas con estado "APROBADA" para las páginas `/reviews` y la homepage. Permite filtrar por empleado y servicio.
- `GET /api/admin/reviews`: Endpoint protegido para que el administrador obtenga todas las reseñas, incluyendo las pendientes y ocultas.
- `PUT /api/admin/reviews/[id]`: Endpoint protegido para que el administrador actualice el estado (`status`) o la propiedad `isFeatured` de una reseña.

```

```
