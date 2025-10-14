# ======================================================================================
# FASE 1: INSTALACIÓN Y GENERACIÓN
# En esta fase, instalamos dependencias Y generamos el cliente de Prisma
# ======================================================================================
FROM node:20-slim AS installer
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Copiar TODOS los archivos de manifiesto Y la carpeta prisma
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY prisma ./prisma

# Instalar TODAS las dependencias (incluidas las de desarrollo)
RUN pnpm install --frozen-lockfile --prod=false

# AHORA SÍ, generar el cliente de Prisma. Ya tenemos las dependencias y el schema.
RUN pnpm prisma generate


# ======================================================================================
# FASE 2: CONSTRUCCIÓN DEL PROYECTO
# Aquí solo nos dedicamos a construir el código fuente
# ======================================================================================
FROM installer AS builder
WORKDIR /app

# Copiar el resto del código fuente
COPY . .

# Construir ambos proyectos (client y server) usando Turborepo
RUN pnpm run build


# ======================================================================================
# FASE 3: IMAGEN FINAL DEL SERVIDOR (BACKEND)
# ======================================================================================
FROM node:20-slim AS server_runner
WORKDIR /app

# Instalar pnpm (necesario para ejecutar los comandos)
RUN npm install -g pnpm

# Copiar los node_modules ya instalados y generados desde la fase 'installer'
COPY --from=installer /app/node_modules ./node_modules

# Copiar solo los archivos necesarios del servidor ya construido
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/apps/server ./apps/server
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001


# ======================================================================================
# FASE 4: IMAGEN FINAL DEL CLIENTE (FRONTEND)
# ======================================================================================
FROM node:20-slim AS client_runner
WORKDIR /app

# Instalar 'serve' para servir los archivos estáticos
RUN npm install -g serve

# Copiar los archivos del cliente ya construidos desde la fase 'builder'
COPY --from=builder /app/apps/client/dist ./dist

EXPOSE 3000