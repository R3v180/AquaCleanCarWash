# ======================================================================================
# FASE 1: BUILDER
# En esta fase, preparamos una imagen que tiene TODO instalado y construido.
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

# Generar el cliente de Prisma.
RUN pnpm --filter server run prisma:generate

# Construir todo el monorepo.
RUN pnpm run build


# ======================================================================================
# FASE 2: IMAGEN FINAL DEL SERVIDOR (BACKEND)
# Esta imagen es más grande, pero contiene TODO lo necesario para funcionar sin errores.
# ======================================================================================
FROM node:20-slim AS server_runner
WORKDIR /app

# Instalar pnpm solo para poder ejecutar comandos
RUN npm install -g pnpm

# --- ¡EL CAMBIO CLAVE! ---
# Copiar TODO el proyecto ya construido desde la fase 'builder'.
# Esto garantiza que TODAS las rutas y archivos son correctos.
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