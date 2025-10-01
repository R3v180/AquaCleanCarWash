# 9. Sistema de Notificaciones

## 9.1. Objetivo

Establecer un sistema de comunicación proactivo y automatizado para mantener informados tanto a los clientes como al personal del negocio en cada etapa clave del ciclo de vida de una cita. Los objetivos principales son: mejorar la experiencia del cliente, reducir drásticamente la tasa de no presentación (no-shows) y minimizar la carga de trabajo administrativo.

## 9.2. Stack Tecnológico

| Canal        | Tecnología                 | Propósito                                                                                                                                                   |
| :----------- | :------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Email**    | **Nodemailer**             | Envío de correos electrónicos transaccionales robustos. Se utilizarán plantillas HTML (ej: `mjml` o `react-email`) para un diseño profesional y responsivo. |
| **WhatsApp** | **Twilio API (o similar)** | Envío de mensajes de WhatsApp para notificaciones de alta prioridad como recordatorios y confirmaciones.                                                    |

## 9.3. Notificaciones para el Cliente

Estas notificaciones se envían al cliente para guiarlo y mantenerlo informado.

| Evento Desencadenante                | Canal(es)       | Contenido Clave                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| :----------------------------------- | :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Registro de Nueva Cuenta**         | Email           | **Asunto:** "Confirma tu cuenta en AquaClean".<br>Contiene un enlace de verificación único y de un solo uso para activar la cuenta.                                                                                                                                                                                                                                                                                                                                             |
| **Solicitud de Contraseña Olvidada** | Email           | **Asunto:** "Restablece tu contraseña de AquaClean".<br>Contiene un enlace seguro para que el usuario pueda establecer una nueva contraseña.                                                                                                                                                                                                                                                                                                                                    |
| **Reserva de Cita Exitosa**          | Email, WhatsApp | **Asunto (Email):** "Tu cita en AquaClean está confirmada para el [Fecha] a las [Hora]".<br> **Mensaje (WhatsApp):** "¡Hola [Nombre]! 👋 Tu cita en AquaClean para un [Servicio] el [Fecha] a las [Hora] está confirmada. ¡Te esperamos!".<br>El email **debe** incluir un archivo adjunto `.ics` para que el cliente pueda añadir la cita a su calendario (Google, Apple, etc.) con un solo clic. También incluirá un resumen completo: servicio, empleado, dirección y coste. |
| **Recordatorio de Cita (24h antes)** | Email, WhatsApp | **Asunto (Email):** "Recordatorio: Tu cita en AquaClean es mañana".<br> **Mensaje (WhatsApp):** "¡Recordatorio! Mañana a las [Hora] tienes tu cita para un [Servicio] en AquaClean. Si necesitas cambiarla, contáctanos. ¡Nos vemos pronto!".<br>Incluye opciones para confirmar la asistencia o contactar para reagendar.                                                                                                                                                      |
| **Cancelación de Cita**              | Email           | **Asunto:** "Tu cita en AquaClean ha sido cancelada".<br>Confirma que la cita para el [Fecha] ha sido cancelada correctamente. Si aplica, informa sobre la política de reembolso.                                                                                                                                                                                                                                                                                               |
| **Cita Marcada como "Completada"**   | Email, WhatsApp | **Asunto (Email):** "¡Gracias por tu visita a AquaClean! ¿Qué tal ha ido?".<br> **Mensaje (WhatsApp):** "¡Gracias por visitarnos, [Nombre]! Esperamos que tu coche haya quedado impecable ✨. ¿Te importaría dejarnos tu opinión en 1 minuto? [Enlace a la página de valoración]".<br>Se envía tras un lapso de tiempo configurable (ej: 3 horas). Contiene el enlace para dejar una reseña en la web y/o en Google.                                                            |

## 9.4. Notificaciones para la Empresa (Administrador)

Estas notificaciones se envían al personal para mantenerlos al tanto de la actividad de los clientes en tiempo real.

| Evento Desencadenante             | Canal(es)       | Contenido Clave                                                                                                                                                                                                                                                                                                                                     |
| :-------------------------------- | :-------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nueva Reserva Realizada**       | Email, WhatsApp | **Asunto (Email):** "Nueva Reserva: [Servicio] para el [Fecha] a las [Hora]".<br> **Mensaje (WhatsApp):** "🔔 ¡Nueva Reserva! Cliente: [Nombre Cliente]. Servicio: [Servicio]. Día: [Fecha] a las [Hora]. Empleado: [Nombre Empleado]".<br>Proporciona todos los detalles de la nueva cita para una visión rápida sin necesidad de entrar al panel. |
| **Cliente Cancela una Cita**      | Email, WhatsApp | **Asunto (Email):** "Cancelación de Cita: [Nombre Cliente] para el [Fecha]".<br> **Mensaje (WhatsApp):** "⚠️ Cancelación. El cliente [Nombre Cliente] ha cancelado su cita para el [Fecha] a las [Hora]".<br>Permite al administrador reaccionar rápidamente y, si es necesario, contactar a otros clientes para ocupar el hueco.                   |
| **Cliente Solicita Cambiar Cita** | Email           | **Asunto:** "Solicitud de Cambio de Cita de [Nombre Cliente]".<br>Informa al administrador que un cliente ha solicitado un cambio y le dirige al panel de administración para gestionar la petición.                                                                                                                                                |

## 9.5. Implementación en el Backend

- Se creará un `NotificationService` centralizado en el backend.
- Este servicio será invocado por otros servicios de la aplicación (ej: `BookingService`, `AuthService`) cuando ocurran los eventos relevantes.
- El `NotificationService` contendrá la lógica para:
  1.  Seleccionar la plantilla de mensaje adecuada (para email o WhatsApp).
  2.  Rellenar la plantilla con los datos dinámicos (nombre del cliente, fecha de la cita, etc.).
  3.  Invocar al proveedor correspondiente (`Nodemailer` o `Twilio`) para realizar el envío.
- Se implementará un sistema de colas (opcional pero recomendado para escalar) para procesar los envíos de notificaciones de forma asíncrona, evitando que la aplicación se ralentice mientras espera la respuesta de las APIs externas.
