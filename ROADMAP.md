<!-- File: /ROADMAP.md - v1.7 (ACTUALIZADO) -->

# Roadmap del Proyecto AquaClean Car Wash

Este documento describe el plan de desarrollo por fases para la plataforma. El objetivo es lanzar un Producto Mínimo Viable (MVP) funcional y luego iterar sobre él añadiendo capas de valor en versiones posteriores.

---

## 🚧 Versión 1.0: MVP - Lanzamiento y Operaciones Core

**Objetivo:** Poner en marcha la funcionalidad esencial para que el negocio pueda recibir y gestionar reservas online.

- **✅ Sitio Público Básico:**
  - [✅] Página de Inicio (Homepage) y Navegación principal.
  - [✅] Página de Servicios detallada.
  - [✅] Perfiles públicos del equipo (`/team`).

- **✅ Flujo de Reserva (Sin Pago):**
  - [✅] Lógica de Disponibilidad (API y Componente de Frontend).
  - [✅] Conexión del flujo (Selección de servicio -> Calendario).
  - [✅] Formulario de datos de cliente y vehículo.
  - [✅] Creación final de la cita en la base de datos.

- **✅ Panel de Administración Esencial:**
  - **✅ Gestión Core:** CRUD completo para Servicios (con estado activo/inactivo) y Empleados (con estado activo/archivado).
  - **✅ Operaciones:** Planning visual de citas (FullCalendar).
    - ✅ Visualización y Reagendamiento (Drag & Drop) funcional.
    - ✅ Creación manual, edición y anulación de citas (modales).
  - **✅ Gestión Avanzada de Horarios (Empleados):**
    - ✅ Editor de turnos semanales por empleado.
    - ✅ Calendario visual para gestionar vacaciones y ausencias.
    - ✅ Sistema de detección de conflictos con citas existentes.
  - [🎯 PRÓXIMO OBJETIVO] **Interfaz para Horario General del Negocio.**
  - [✅] **Autenticación:** Login seguro para el administrador.

- **[ ] Notificaciones Críticas (Email):**
  - [ ] Email de confirmación de cita para el cliente.
  - [ ] Email de notificación de nueva cita para la empresa.

---

## ✨ Versión 1.1: Fidelización y Experiencia de Cliente

**Objetivo:** Mejorar la retención de clientes y automatizar el marketing de reputación.

- **[ ] Panel de Cliente Completo:**
  - [ ] Registro de usuarios (Email/Google) con verificación.
  - [ ] Login y gestión de perfil.
  - [ ] Historial de citas y opción "Reservar de Nuevo".
  - [ ] Gestión de múltiples vehículos.

- **[ ] Sistema de Valoraciones y Reseñas:**
  - [ ] Email/WhatsApp automático post-servicio para solicitar valoración.
  - [ ] Panel de moderación de reseñas en el área de administración.
  - [ ] Visualización de reseñas aprobadas en el sitio público.

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

- **[ ] Dashboard de Analíticas:**
  - [ ] Gráficos con métricas clave (ingresos, ocupación, servicios populares, etc.).

- **[ ] Notificaciones Avanzadas (WhatsApp):**
  - [ ] Recordatorios de citas automáticos por WhatsApp.
  - [ ] Notificaciones de nuevas citas por WhatsApp para la empresa.

---

## 💡 Futuro (Ideas a Considerar)

- **Pagos Configurables:** Permitir al administrador elegir si las reservas requieren pago (completo/parcial) o no.
- PWA para Empleados: Una aplicación "instalable" para que los empleados gestionen su agenda diaria.
- Precios Dinámicos: Configuración de tarifas especiales para horas de alta/baja demanda.
- Tienda Online: Venta de productos de detailing directamente desde la web.
- Integración con Software de Contabilidad.
