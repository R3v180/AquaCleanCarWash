<!-- File: /docs/features/01-authentication.md - v1.0 -->
````markdown
# 1. Sistema de Autenticación

## 1.1. Objetivo

Permitir a los usuarios crear una cuenta segura y acceder a su panel personal. Ofrecer métodos de registro modernos y de baja fricción para maximizar la conversión de visitante a cliente registrado, incluyendo el registro clásico por email y el inicio de sesión social con Google.

## 1.2. Flujos de Usuario (User Stories)

### Registro con Email y Contraseña

1.  Como nuevo usuario, quiero poder hacer clic en "Registrarse".
2.  Quiero ver un formulario que me pida Nombre, Email y Contraseña.
3.  La contraseña debe tener un indicador de seguridad visual (ej: mínimo 8 caracteres, una mayúscula, un número).
4.  Al enviar el formulario, quiero recibir un email para verificar que mi correo es real.
5.  La aplicación debe informarme de que revise mi bandeja de entrada para completar el registro.
6.  Al hacer clic en el enlace de verificación del email, mi cuenta se activará y seré redirigido a la página de "Inicio de Sesión".

### Registro / Inicio de Sesión con Google (OAuth)

1.  Como usuario, quiero ver un botón "Continuar con Google" en las páginas de registro e inicio de sesión.
2.  Al hacer clic, quiero que se abra el pop-up de autenticación de Google.
3.  Tras autorizar los permisos, si es mi primera vez, se debe crear una cuenta en el sistema automáticamente con mi nombre y email de Google.
4.  Si ya tengo una cuenta asociada a ese email, se debe iniciar sesión.
5.  En ambos casos, debo ser redirigido a mi "Panel de Cliente" (`/dashboard`).

### Inicio de Sesión Clásico

1.  Como usuario registrado, quiero poder introducir mi email y contraseña para acceder.
2.  Quiero una opción de "Recordar sesión" (checkbox) para no tener que iniciar sesión cada vez.
3.  Si introduzco credenciales incorrectas, quiero ver un mensaje de error claro.
4.  Quiero un enlace de "¿Has olvidado tu contraseña?" por si no la recuerdo.

### Recuperación de Contraseña

1.  Al hacer clic en "¿Has olvidado tu contraseña?", quiero ir a una página donde introduzco mi dirección de email.
2.  Tras enviar mi email, quiero recibir un correo con un enlace seguro y de un solo uso para establecer una nueva contraseña.
3.  Al hacer clic en el enlace, quiero ser llevado a una página donde pueda introducir y confirmar mi nueva contraseña.
4.  Tras cambiarla con éxito, quiero ser redirigido a la página de "Inicio de Sesión".

## 1.3. Componentes de UI (Vistas Necesarias)

- Página de Registro: `/auth/register`
- Página de Inicio de Sesión: `/auth/login`
- Página de "Verifica tu Email": `/auth/verify-request` (Página informativa que se muestra tras el registro).
- Página de "Contraseña Olvidada": `/auth/forgot-password`
- Página para "Restablecer Contraseña": `/auth/reset-password?token=[TOKEN]`

## 1.4. Modelo de Datos (Esquema Prisma)

```prisma
// Este esquema define la estructura de la base de datos para la autenticación.
// Sigue el estándar de NextAuth.js/Auth.js para máxima compatibilidad.

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  passwordHash  String?   // Hash de la contraseña para usuarios de email/pass
  image         String?
  accounts      Account[]
  sessions      Session[]
  appointments  Appointment[]
  // ... otros campos relacionados con el cliente
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String  // ej. "google"
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```
````

## 1.5. Endpoints de la API

- `POST /api/auth/register`: Recibe `{ name, email, password }`. Crea el usuario (inactivo), genera un token de verificación y envía el email.
- `POST /api/auth/login`: Recibe `{ email, password }`. Valida las credenciales y devuelve una sesión (cookie JWT).
- `GET /api/auth/verify-email?token=[TOKEN]`: Valida el token de email, marca `emailVerified` en la base de datos y activa la cuenta.
- `POST /api/auth/forgot-password`: Recibe `{ email }`. Genera un token de reseteo y lo envía por email.
- `POST /api/auth/reset-password`: Recibe `{ token, newPassword }`. Valida el token y actualiza el `passwordHash` del usuario.
- `GET /api/auth/providers/google`: Redirige al usuario a la página de consentimiento de Google (inicia el flujo OAuth).
- `GET /api/auth/providers/google/callback`: Endpoint al que Google redirige tras la autorización. Procesa los datos del usuario, crea/loguea al usuario y establece la sesión.
- `POST /api/auth/logout`: Cierra la sesión del usuario.

```

```

