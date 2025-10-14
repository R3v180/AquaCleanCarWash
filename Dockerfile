# ======================================================================================
# FASE 1: INSTALACIÓN DE DEPENDENCIAS
# ======================================================================================
FROM node:20-slim AS installer
WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar solo los archivos de manifiesto para aprovechar el cacheo de Docker
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalar TODAS las dependencias del monorepo
RUN pnpm install --frozen-lockfile


# ======================================================================================
# FASE 2: CONSTRUCCIÓN DEL PROYECTO
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

# Copiar los node_modules ya instalados desde la fase 'installer'
COPY --from=installer /app/node_modules ./node_modules

# Copiar solo los archivos necesarios del servidor ya construido
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/apps/server ./apps/server
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/prisma ./prisma

# Exponer el puerto del servidor
EXPOSE 3001

# El comando de inicio se definirá en la UI de Railway
# (pnpm --filter server run migrate:deploy && pnpm --filter server start)


# ======================================================================================
# FASE 4: IMAGEN FINAL DEL CLIENTE (FRONTEND)
# ======================================================================================
FROM node:20-slim AS client_runner
WORKDIR /app

# Instalar 'serve' para servir los archivos estáticos
RUN npm install -g serve

# Copiar los archivos del cliente ya construidos desde la fase 'builder'
COPY --from=builder /app/apps/client/dist ./dist

# Exponer el puerto por defecto de 'serve'
EXPOSE 3000

# El comando de inicio se definirá en la UI de Railway (npx serve -s dist)