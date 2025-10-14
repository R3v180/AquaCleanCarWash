# ======================================================================================
# FASE 1: BUILDER
# ======================================================================================
FROM node:20-slim AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Copiamos TODO el código fuente de una sola vez.
COPY . .

# Instalar TODAS las dependencias, leyendo el .npmrc
RUN pnpm install --frozen-lockfile --prod=false

# Ejecutamos el script "prisma:generate" que está DEFINIDO en el package.json del servidor.
RUN pnpm --filter server run prisma:generate

# Construir todo el monorepo con Turborepo.
RUN pnpm run build


# ======================================================================================
# FASE 2: IMAGEN FINAL DEL SERVIDOR (BACKEND)
# ======================================================================================
FROM node:20-slim AS server_runner
WORKDIR /app

# --- ¡ESTA ES LA LÍNEA CRUCIAL QUE VUELVO A AÑADIR! ---
# Instalar pnpm para que el Start Command pueda usarlo.
RUN npm install -g pnpm

# Copiar TODO el proyecto ya construido desde la fase 'builder'.
COPY --from=builder /app .

EXPOSE 3001


# ======================================================================================
# FASE 3: IMAGEN FINAL DEL CLIENTE (FRONTEND)
# ======================================================================================
FROM node:20-slim AS client_runner
WORKDIR /app

# Instalar 'serve' para servir los archivos estáticos
RUN npm install -g serve

# Copiar solo los archivos del cliente ya construidos desde la fase 'builder'
COPY --from=builder /app/apps/client/dist ./dist

EXPOSE 3000