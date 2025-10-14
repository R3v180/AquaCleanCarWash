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

# Instalar TODAS las dependencias (incluidas las de desarrollo), leyendo el .npmrc
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

# Instalar pnpm solo para poder ejecutar comandos
RUN npm install -g pnpm

# Copiar los node_modules ya instalados desde la fase 'builder'
COPY --from=builder /app/node_modules ./node_modules

# Copiar solo los archivos necesarios del servidor ya construido
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/apps/server ./apps/server
COPY --from=builder /app/packages ./packages

# --- ¡ESTA ES LA LÍNEA CORREGIDA Y CLAVE! ---
# Copiamos la carpeta prisma DESDE su ubicación real en el builder.
COPY --from=builder /app/apps/server/prisma ./prisma

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