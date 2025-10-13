<!-- File: /README.md - v1.4 (ACTUALIZADO CON ÚLTIMOS AVANCES) -->
<div align="center">
  <img src="./docs/assets/logo.png" alt="AquaClean Car Wash Logo" width="200"/>
</div>

# AquaClean Car Wash - Plataforma de Gestión y Reservas

![Versión](https://img.shields.io/badge/version-1.1.0-blue)
![Estado](https://img.shields.io/badge/status-en--desarrollo-green)
![Licencia](https://img.shields.io/badge/licencia-privada-red)

Una solución web completa para lavaderos de coches que automatiza las reservas, optimiza la gestión de clientes y potencia el marketing digital. Este proyecto está diseñado para ser una base robusta y reutilizable para negocios del sector.

---

## 🎥 Demo Visual

<!-- TODO: Añadir un GIF animado mostrando el flujo de reserva del cliente y el panel de administración -->
<div align="center">
  *Próximamente: Una demostración visual del producto en acción.*
</div>

---

## ✨ Características Principales

| Característica                          | Estado                       | Descripción                                                                                                                                                              |
| :-------------------------------------- | :--------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 📅 **Sistema de Reservas 24/7**         | 🟢 Implementado              | Permite a clientes (registrados o invitados) ver la disponibilidad en tiempo real y reservar una cita.                                                                   |
| 📊 **Panel de Administración Completo** | 🟢 Implementado              | Centro de control para gestionar citas, servicios, empleados y horarios. Incluye un dashboard con KPIs, planning visual interactivo y un panel de moderación de reseñas. |
| ⭐ **Sistema de Valoraciones**          | 🟢 Implementado              | Automatiza la solicitud de reseñas post-servicio por Email/WhatsApp y permite moderarlas antes de mostrarlas públicamente en la web.                                     |
| 🔔 **Notificaciones Automáticas**       | 🟢 Implementado              | Confirmaciones de reserva y recordatorios 24h antes por Email/WhatsApp para reducir las ausencias y mantener a todos informados.                                         |
| 👤 **Panel de Cliente**                 | 🟡 Parcialmente Implementado | Los clientes pueden registrarse, iniciar sesión y ver su historial de citas, con opción de cancelar las futuras.                                                         |
| 💳 **Múltiples Vías de Ingreso**        | ⏳ Pendiente                 | Soporte para bonos, tarjetas regalo y suscripciones mensuales para fidelizar clientes y generar ingresos recurrentes.                                                    |
| 🔗 **Integraciones Clave**              | ⏳ Pendiente                 | Sincronización bidireccional con Google Calendar y pasarela de pagos segura con Stripe.                                                                                  |
| 📱 **Diseño 100% Adaptativo**           | 🟡 Parcialmente Implementado | La experiencia de usuario es funcional en móvil, tablet y ordenador, con mejoras de pulido pendientes.                                                                   |

---

## 🛠️ Stack Tecnológico

| Área                                     | Tecnologías                                                        |
| :--------------------------------------- | :----------------------------------------------------------------- |
| **Frontend**                             | React 18, TypeScript, Vite, Mantine UI, Zustand                    |
| **Backend**                              | Node.js, Express.js, TypeScript, Prisma, Zod                       |
| **Base de Datos**                        | PostgreSQL                                                         |
| **Testing**                              | Vitest, React Testing Library                                      |
| **Herramientas de Desarrollo y Calidad** | pnpm (Monorepo), Git, GitHub, ESLint, Prettier, Husky, lint-staged |

---

## 🚀 Cómo Empezar (Guía para Desarrolladores)

<details>
<summary><strong>Haz clic aquí para ver las instrucciones</strong></summary>

### Requisitos Previos

- Node.js (v20+), pnpm (v9+), Git, una instancia de PostgreSQL.

### Pasos

1. Clonar: `git clone https://github.com/R3v180/AquaCleanCarWash.git`
2. Instalar: `pnpm install`
3. Configurar: Copia `apps/server/.env.example` a `.env` y rellena las variables.
4. Migrar: `pnpm --filter server run migrate:dev`
5. Poblar: `pnpm --filter server run prisma:seed`
6. Iniciar: `pnpm dev`

</details>

---

## 🗺️ Roadmap del Proyecto

Para ver el plan de desarrollo detallado por fases, consulta nuestro archivo [**ROADMAP.md**](./ROADMAP.md).

## 📄 Especificaciones Completas

Toda la funcionalidad del proyecto está documentada en detalle en nuestra [**Especificación de Proyecto**](./docs/PROJECT_SPECIFICATION.md).
