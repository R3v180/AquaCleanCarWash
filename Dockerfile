# ======================================================================================
# FASE 1: BASE CON PNPM
# ======================================================================================
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app


# ======================================================================================
# FASE 2: INSTALACIÓN DE DEPENDENCIAS
# ======================================================================================
FROM base AS installer
# --- CAMBIO 1: Copiar .npmrc ---
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --prod=false

# --- CAMBIO 2: Generar el cliente de Prisma ---
COPY prisma ./prisma
RUN pnpm prisma generate


# ======================================================================================
# FASE 3: CONSTRUCCIÓN DEL PROYECTO
# ======================================================================================
FROM base AS builder
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/node_modules/.pnpm ./node_modules/.pnpm
COPY . .

# 1. Construir paquetes compartidos
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

# Copiar solo los artefactos de producción necesarios
COPY --from=installer /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/prisma ./prisma
# Copiamos el cliente de Prisma generado
COPY --from=installer /app/node_modules/.pnpm/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3001


# ======================================================================================
# FASE 5: IMAGEN FINAL DEL CLIENTE (FRONTEND)
# ======================================================================================
FROM base AS client_runner
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/apps/client/dist ./dist
EXPOSE 3000