# ---- Fase Única de Construcción y Ejecución ----
# Usamos una imagen completa de Node.js para tener todas las herramientas
FROM node:20

# Instalamos 'openssl', que es una buena práctica para Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Habilitamos pnpm
RUN corepack enable

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos TODO el proyecto al contenedor.
# El .dockerignore se encargará de excluir lo que no queremos.
COPY . .

# Instalamos TODAS las dependencias del monorepo
# Usamos --shamefully-hoist para asegurar que Prisma CLI esté accesible
RUN pnpm install --shamefully-hoist

# Construimos SOLAMENTE el servicio 'server'
RUN pnpm --filter server build

# Exponemos el puerto que usa tu servidor
EXPOSE 3001

# El comando final para arrancar el servidor
# Se ejecuta con el contexto del monorepo, por lo que pnpm encontrará todo.
CMD ["sh", "-c", "pnpm --filter server run migrate:deploy && pnpm --filter server start"]