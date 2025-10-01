````markdown
# 8. Módulos de Marketing y Monetización

## 8.1. Objetivo

Crear un conjunto de herramientas integradas en la plataforma para diversificar las fuentes de ingresos, aumentar el valor de vida del cliente (LTV) y fomentar la lealtad a la marca. Estos módulos transforman la web de una simple herramienta de reservas a una plataforma de crecimiento para el negocio.

## 8.2. Desglose de Módulos

### Módulo 1: Gestión de Bonos (Bundles)

**Propósito:** Incentivar la compra por adelantado de múltiples servicios a un precio reducido, asegurando ingresos y visitas futuras.

**Funcionalidad en el Panel de Administración (`/admin/marketing/bonuses`):**

- **CRUD de Bonos:** Interfaz para crear, editar y desactivar ofertas de bonos.
- **Formulario de Creación/Edición:**
  - **Nombre del Bono:** Ej: "Bono 5 Lavados Premium".
  - **Servicio Asociado:** Selección de un único servicio del catálogo.
  - **Cantidad de Usos:** Ej: 5.
  - **Precio Total:** Precio con descuento por el paquete completo.
  - **Periodo de Validez (Opcional):** Ej: "Válido por 12 meses desde la compra".
  - **Estado:** Activo / Inactivo.

**Experiencia del Cliente:**

- Una sección en el sitio público para comprar estos bonos.
- El pago se realiza a través de Stripe.
- En su "Panel de Cliente", el usuario puede ver sus bonos activos y los usos restantes.
- Durante el flujo de reserva, si el cliente elige un servicio para el que tiene un bono con usos disponibles, el sistema le ofrecerá la opción de "Usar 1 crédito del bono" en lugar de pagar.

**Modelo de Datos (Prisma):**

```prisma
// Definición del bono que se puede comprar
model BonusOffering {
  id          String   @id @default(cuid())
  name        String
  price       Float
  uses        Int
  validityDays Int?
  isActive    Boolean  @default(true)

  service     Service  @relation(fields: [serviceId], references: [id])
  serviceId   String
}

// Instancia de un bono comprado por un cliente
model PurchasedBonus {
  id              String   @id @default(cuid())
  usesRemaining   Int
  expiresAt       DateTime?

  user            User     @relation(fields: [userId], references: [id])
  userId          String

  bonusOffering   BonusOffering @relation(fields: [bonusOfferingId], references: [id])
  bonusOfferingId String
}
```
````

### Módulo 2: Tarjetas Regalo (Gift Cards)

**Propósito:** Abrir una nueva vía de ingresos permitiendo que los servicios del lavadero sean regalados, ideal para ocasiones especiales.

**Funcionalidad en el Panel de Administración:**

- No requiere gestión activa más allá de tener los servicios marcados como "regalables".
- Una sección para visualizar las tarjetas regalo vendidas y su estado (canjeada/no canjeada).

**Experiencia del Cliente (Comprador y Receptor):**

- Página pública `/gift-cards` para la compra.
- El comprador elige un servicio, introduce los datos del destinatario y un mensaje personalizado.
- Tras el pago con Stripe, el sistema genera un **código de regalo único**.
- Se envía un email al destinatario (o al comprador) con un diseño de tarjeta regalo digital que incluye el código.
- El receptor de la tarjeta puede canjear el código durante el paso de pago del flujo de reserva, lo que aplicará un descuento del 100%.

**Modelo de Datos (Prisma):**

```prisma
model GiftCard {
  id            String    @id @default(cuid())
  code          String    @unique // Código alfanumérico único
  isRedeemed    Boolean   @default(false)
  redeemedAt    DateTime?
  recipientEmail String?
  message       String?   @db.Text

  // Relaciones
  service       Service   @relation(fields: [serviceId], references: [id])
  serviceId     String

  purchaseOrder Order     @relation(fields: [orderId], references: [id])
  orderId       String
}
```

### Módulo 3: Suscripciones (Club de Lavado)

**Propósito:** Generar ingresos mensuales recurrentes y predecibles, creando una base de clientes de alta fidelidad.

**Funcionalidad en el Panel de Administración (`/admin/marketing/subscriptions`):**

- **CRUD de Planes de Suscripción:**
  - **Nombre del Plan:** Ej: "Club AquaClean Oro".
  - **Precio Mensual:** Ej: 49.99€.
  - **Beneficios Incluidos:**
    - Una interfaz para definir cuántos usos de qué servicios incluye al mes (ej: "2 Lavados Premium", "4 Lavados Básicos").
  - **Integración con Stripe Products & Prices** para gestionar la facturación recurrente.

**Experiencia del Cliente:**

- Página pública `/club` para ver y suscribirse a los planes.
- El pago mensual es automático a través de Stripe.
- En su panel, el cliente ve su estado de suscripción y los servicios que puede usar ese mes.
- Al igual que con los bonos, al reservar un servicio incluido en su plan, puede canjearlo sin coste adicional.

### Módulo 4: Programa de Fidelización (Puntos)

**Propósito:** Recompensar la recurrencia, incentivando a los clientes a volver para acumular beneficios.

**Funcionalidad en el Panel de Administración (`/admin/marketing/loyalty`):**

- **Configuración del Programa:**
  - Definir la regla de acumulación (ej: "1€ gastado = 1 punto").
  - Definir las recompensas (ej: "500 puntos = 1 Lavado Básico Gratis").
- El sistema asignará los puntos automáticamente después de cada cita completada.

**Experiencia del Cliente:**

- En su panel (`/dashboard/benefits`), el cliente ve su saldo de puntos.
- El cliente es notificado cuando alcanza los puntos necesarios para una recompensa.
- Se le proporciona un código de descuento o una opción en el flujo de reserva para canjear su recompensa.

## 8.3. Endpoints de la API

- `GET /api/bonuses`: Devuelve los bonos disponibles para la compra.
- `POST /api/bonuses/purchase`: Inicia la compra de un bono.
- `POST /api/gift-cards/purchase`: Inicia la compra de una tarjeta regalo.
- `POST /api/bookings/redeem`: Endpoint para canjear bonos, tarjetas regalo o puntos durante la reserva.
- `GET /api/admin/marketing/...`: Endpoints protegidos para toda la gestión de estos módulos.

```

```
