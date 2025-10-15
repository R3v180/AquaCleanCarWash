# Usar una imagen base con Node 20
FROM node:20-slim

# Instalar dependencias necesarias para Prisma
RUN apt-get update -y && apt-get install -y openssl

# Habilitar corepack para pnpm
RUN corepack enable

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos del monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/server apps/server
COPY packages packages

# Instalar dependencias
RUN pnpm install --frozen-lockfile --prod=false

# Generar Prisma Client
RUN pnpm --filter server run prisma:generate

# Construir solo el servidor
RUN pnpm --filter server run build

# Exponer puerto (3000, según tu app Express)
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["node", "apps/server/dist/server.js"]