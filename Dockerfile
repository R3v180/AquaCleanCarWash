# ======================================================================================
# FASE 1: BUILDER
# En esta única fase, preparamos una imagen que tiene TODO instalado y construido.
# ======================================================================================
FROM node:20-slim AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Copiamos TODO el código fuente de una sola vez.
# Esto elimina CUALQUIER error de "fichero no encontrado".
COPY . .

# Instalar TODAS las dependencias (incluidas las de desarrollo), leyendo el .npmrc
RUN pnpm install --frozen-lockfile --prod=false

# Generar el cliente de Prisma. Ahora tiene todo lo que necesita.
RUN pnpm prisma generate

# Construir todo el monorepo con Turborepo.
RUN pnpm run build

# Limpiar las dependencias de desarrollo para hacer la imagen más ligera.
RUN pnpm prune --prod


# ======================================================================================
# FASE 2: IMAGEN FINAL DEL SERVIDOR (BACKEND)
# Esta imagen es ligera y solo contiene lo necesario para ejecutar el servidor.
# ======================================================================================
FROM node:20-slim AS server_runner
WORKDIR /app

# Instalar pnpm solo para poder ejecutar comandos
RUN npm install -g pnpm

# Copiar el proyecto ya construido y limpiado desde la fase 'builder'
COPY --from=builder /app .

EXPOSE 3001


# ======================================================================================
# FASE 3: IMAGEN FINAL DEL CLIENTE (FRONTEND)
# Esta imagen es ligera y solo contiene lo necesario para ejecutar el cliente.
# ======================================================================================
FROM node:20-slim AS client_runner
WORKDIR /app

# Instalar 'serve' para servir los archivos estáticos
RUN npm install -g serve

# Copiar solo los archivos del cliente ya construidos desde la fase 'builder'
COPY --from=builder /app/apps/client/dist ./dist

EXPOSE 3000