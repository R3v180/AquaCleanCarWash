<!-- File: /ROADMAP.md - v2.1 (Panel de Cliente en Progreso) -->

# Roadmap del Proyecto AquaClean Car Wash

Este documento describe el plan de desarrollo por fases para la plataforma. El objetivo es lanzar un Producto Mínimo Viable (MVP) funcional y luego iterar sobre él añadiendo capas de valor en versiones posteriores.

---

## 🚧 Versión 1.0: MVP - Lanzamiento y Operaciones Core

**Objetivo:** Poner en marcha la funcionalidad esencial para que el negocio pueda recibir y gestionar reservas online.

- **✅ Sitio Público Básico:**
  - [✅] Página de Inicio (Homepage) y Navegación principal.
  - [✅] Página de Servicios detallada.
  - [✅] Perfiles públicos del equipo (`/team`).

- **✅ Flujo de Reserva (Sin Pago) - COMPLETADO:**
  - [✅] Lógica de Disponibilidad (API y Componente de Frontend).
  - [✅] Conexión del flujo (Selección de servicio -> Calendario).
  - [✅] Formulario de datos de cliente.
  - [✅] Creación final de la cita en la base de datos.
  - [✅] Auto-asignación de empleado para "Cualquier Profesional".

- **✅ Panel de Administración Esencial:**
  - **✅ Gestión Core:** CRUD completo para Servicios y Empleados.
  - **✅ Operaciones:** Planning visual de citas (FullCalendar).
    - ✅ Visualización y Reagendamiento (Drag & Drop) funcional.
    - ✅ Creación manual, edición y anulación de citas (modales).
  - **✅ Gestión Avanzada de Horarios:**
    - ✅ Editor de turnos semanales, calendario de ausencias y anulaciones por fecha.
  - ✅ **Autenticación:** Login seguro para el administrador.

- **✅ Notificaciones Críticas (Email/WhatsApp) - COMPLETADO:**
  - [✅] Email/WhatsApp de confirmación de cita para el cliente.
  - [✅] Email de notificación de nueva cita para la empresa.
  - [✅] Recordatorios automáticos 24h antes de la cita.

---

## ✨ Versión 1.1: Fidelización y Experiencia de Cliente

**Objetivo:** Mejorar la retención de clientes y automatizar el marketing de reputación.

- **🟡 Panel de Cliente Completo - EN PROGRESO:**
  - [✅] Registro de usuarios (Email) y Login.
  - [🟡] Historial de citas y opción "Reservar de Nuevo".
  - [ ] Gestión de perfil (cambiar nombre/contraseña).
  - [ ] Gestión de múltiples vehículos.

- **✅ Sistema de Valoraciones y Reseñas - COMPLETADO:**
  - [✅] Notificación automática post-servicio para solicitar valoración.
  - [✅] Panel de moderación de reseñas en el área de administración.
  - [✅] Visualización de reseñas aprobadas en el sitio público.

- **[ ] Integración con Pasarela de Pagos (Stripe):**
  - [ ] Integración básica para pagos en el flujo de reserva.

- **[ ] Integración con Google Calendar:**
  - [ ] Sincronización bidireccional para citas y bloqueos.

---

## 🚀 Versión 1.2: Monetización Avanzada y Analíticas

**Objetivo:** Introducir nuevas vías de ingresos y proporcionar herramientas de inteligencia de negocio.

- **[ ] Módulos de Marketing y Monetización:**
  - [ ] Creación y gestión de Bonos de lavados.
  - [ ] Venta de Tarjetas Regalo digitales.
  - [ ] Sistema de suscripciones mensuales (Club de Lavado).

- **🟡 Dashboard de Analíticas - EN PROGRESO:**
  - [✅] KPIs de negocio (citas, ingresos, no-shows).
  - [✅] Gráfico de actividad semanal.
  - [ ] Gráficos con métricas avanzadas (servicios populares, etc.).

- **[ ] Notificaciones Avanzadas (WhatsApp):**
  - [ ] Notificaciones de nuevas citas por WhatsApp para la empresa.
