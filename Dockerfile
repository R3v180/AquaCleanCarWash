# ======================================================================================
# FASE 1: BASE CON PNPM
# Preparamos una imagen base que ya tiene pnpm instalado y configurado
# ======================================================================================
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app


# ======================================================================================
# FASE 2: INSTALACIÓN DE DEPENDENCIAS
# En esta fase, instalamos TODAS las dependencias del monorepo
# ======================================================================================
FROM base AS installer
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --prod=false


# ======================================================================================
# FASE 3: CONSTRUCCIÓN DEL PROYECTO (¡EL CAMBIO CLAVE!)
# Aquí construimos cada paquete uno por uno, en orden, sin usar Turborepo
# ======================================================================================
FROM base AS builder
COPY --from=installer /app/node_modules ./node_modules
COPY . .

# 1. Construir paquetes compartidos PRIMERO
RUN pnpm --filter @aquaclean/config build
RUN pnpm --filter @aquaclean/types build

# 2. Construir el servidor (backend)
RUN pnpm --filter server build

# 3. Construir el cliente (frontend)
RUN pnpm --filter client build


# ======================================================================================
# FASE 4: IMAGEN FINAL DEL SERVIDOR (BACKEND)
# ======================================================================================
FROM base AS server_runner
WORKDIR /app

# Copiar solo los artefactos de producción necesarios para el servidor
COPY --from=installer /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001


# ======================================================================================
# FASE 5: IMAGEN FINAL DEL CLIENTE (FRONTEND)
# ======================================================================================
FROM base AS client_runner
WORKDIR /app

# Instalar 'serve' para servir los archivos estáticos
RUN npm install -g serve

# Copiar los archivos del cliente ya construidos
COPY --from=builder /app/apps/client/dist ./dist

EXPOSE 3000