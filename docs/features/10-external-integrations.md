<!-- File: /docs/features/10-external-integrations.md - v1.0 -->
````markdown
# 10. Integraciones Externas

## 10.1. Objetivo

Integrar la plataforma con servicios de terceros líderes en su sector para incorporar funcionalidades críticas de forma robusta y segura. Esto nos permite centrarnos en el valor añadido de nuestra aplicación mientras delegamos tareas complejas como el procesamiento de pagos y la sincronización de calendarios a APIs especializadas.

## 10.2. Pasarela de Pagos: Stripe

**Propósito:** Gestionar todas las transacciones monetarias de la plataforma, desde citas individuales hasta la compra de bonos y suscripciones recurrentes.

### Funcionalidades Clave

- **Procesamiento de Pagos Únicos:** Aceptar pagos con tarjeta de crédito/débito para reservas de citas y compra de tarjetas regalo.
- **Gestión de Suscripciones:** Automatizar los cobros mensuales para los clientes del "Club de Lavado" a través de **Stripe Billing**.
- **Seguridad y Cumplimiento PCI:** Delegar el manejo de la información sensible de las tarjetas a Stripe, asegurando el máximo nivel de seguridad y cumplimiento normativo.
- **Portal de Cliente de Stripe (Opcional):** Permitir a los clientes suscritos gestionar sus métodos de pago y facturas directamente a través de un portal alojado por Stripe.

### Flujo de Implementación

1.  **Configuración:**

    - Se crearán cuentas de Producto y Precio en el dashboard de Stripe para cada servicio, bono y plan de suscripción.
    - Las claves de API (pública y secreta) de Stripe se configurarán en las variables de entorno del backend.

2.  **Flujo de Pago Único (para Citas/Regalos):**

    - **Frontend:**
      - Se utilizará la librería `@stripe/react-stripe-js`.
      - Al llegar al paso de pago, el cliente solicitará un `client_secret` a nuestra API.
      - Se renderizará el componente `PaymentElement` de Stripe, que es un formulario de pago seguro y unificado.
    - **Backend:**
      - Se creará un endpoint `POST /api/payments/create-intent`.
      - Este endpoint calculará el importe total y creará un `PaymentIntent` en Stripe, devolviendo su `client_secret` al frontend.
    - **Confirmación:**
      - Tras el envío del formulario por parte del cliente, Stripe procesará el pago.
      - El backend escuchará los **Webhooks** de Stripe (evento `payment_intent.succeeded`) para confirmar el pago de forma fiable y, en ese momento, finalizará la creación de la reserva en la base de datos.

3.  **Flujo de Suscripciones:**
    - Se utilizará Stripe Checkout o el Payment Element para la suscripción inicial.
    - El backend creará un `Customer` en Stripe para cada usuario que se suscriba.
    - Se crearán objetos `Subscription` en Stripe, que gestionarán los cobros recurrentes automáticamente.
    - Los Webhooks (`invoice.paid`, `customer.subscription.deleted`, etc.) serán esenciales para mantener el estado de la suscripción sincronizado en nuestra base de datos.

### Modelo de Datos (Prisma)

```prisma
model User {
  // ... campos existentes
  stripeCustomerId String? @unique // ID del cliente en Stripe
}

model Appointment {
  // ... campos existentes
  paymentIntentId String? @unique // ID del intento de pago de Stripe
  paymentStatus   PaymentStatus @default(PENDING)
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
}
```
````

## 10.3. Sincronización de Calendario: Google Calendar

**Propósito:** Ofrecer una conexión opcional para el administrador que sincroniza la agenda de la plataforma con un Google Calendar de la empresa, mejorando la visibilidad y la gestión de la disponibilidad desde fuera de la aplicación.

### Funcionalidades Clave

- **Sincronización de Citas (App -> Google Calendar):**
  - Cuando una cita se crea, reagenda o cancela en nuestra plataforma, el evento correspondiente se crea, actualiza o elimina automáticamente en el Google Calendar del negocio.
- **Sincronización de Disponibilidad (Google Calendar -> App):**
  - Cuando el administrador crea un evento manual en su Google Calendar (ej: "Cita Médica", "Reunión"), el sistema de nuestra aplicación lo detectará como un "bloqueo de tiempo".
  - Ese intervalo de tiempo se marcará como no disponible en el calculador de disponibilidad de la web, evitando que los clientes puedan reservar en ese hueco.

### Flujo de Implementación

1.  **Autorización (OAuth 2.0):**

    - En el panel de administración, habrá una sección de "Integraciones".
    - El administrador hará clic en "Conectar con Google Calendar".
    - Esto iniciará un flujo de consentimiento de OAuth 2.0 donde el administrador autoriza a nuestra aplicación a gestionar su calendario.
    - El backend recibirá y almacenará de forma segura las credenciales de OAuth (access token y refresh token) asociadas a la cuenta del negocio.

2.  **Creación y Modificación de Eventos:**

    - Cuando se crea una cita, el backend utilizará las credenciales guardadas para llamar a la API de Google Calendar y crear un nuevo evento.
    - La información del evento incluirá: nombre del servicio, nombre del cliente y empleado asignado.
    - El `googleEventId` devuelto por la API se guardará en nuestro modelo `Appointment`.
    - Para actualizar o cancelar, se usará ese `googleEventId` guardado para modificar el evento correcto.

3.  **Lectura de Disponibilidad:**
    - Cuando el sistema calcula los huecos disponibles para un día, además de mirar las citas en nuestra propia base de datos, hará una llamada a la API de Google (`freebusy`) para consultar los periodos de tiempo ocupados en el calendario del administrador.
    - Estos periodos ocupados se restarán de la disponibilidad total.

### Modelo de Datos (Prisma)

```prisma
model Appointment {
  // ... campos existentes
  googleEventId String? @unique // ID del evento en Google Calendar
}

// Modelo para guardar las credenciales de la empresa
model AccountSettings {
  id                    String @id @default(cuid())
  googleAccessToken     String? @db.Text
  googleRefreshToken    String? @db.Text
  googleTokenExpiryDate DateTime?
  // ... otras configuraciones del negocio
}
```

