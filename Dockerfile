# ---- Fase de Construcción (Builder) ----
# Usamos una imagen completa de Node.js para tener todas las herramientas
FROM node:20 AS builder

# Habilitamos pnpm
RUN corepack enable

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos TODOS los archivos de configuración y manifiestos del monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/ packages/
COPY apps/ apps/
COPY prisma/ prisma/

# Instalamos TODAS las dependencias del monorepo
RUN pnpm install --frozen-lockfile

# Construimos SOLAMENTE el servicio 'server'
RUN pnpm --filter server build

# ---- Fase de Ejecución (Runner) ----
# Usamos una imagen ligera de Node.js para la producción
FROM node:20-slim

# Instalamos 'openssl', que es una buena práctica para Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos solo los archivos necesarios desde la fase de construcción
# IMPORTANTE: Ahora copiamos el 'node_modules' completo, sin podar.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json

# Exponemos el puerto que usa tu servidor
EXPOSE 3001

# El comando final para arrancar el servidor
CMD ["sh", "-c", "pnpm --filter server run migrate:deploy && pnpm --filter server start"]