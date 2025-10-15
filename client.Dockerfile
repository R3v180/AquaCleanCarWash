# Dockerfile para el CLIENTE

# ---- Fase 1: Build ----
FROM node:20 AS builder
WORKDIR /app

# Habilitar pnpm
RUN corepack enable

# Copiar solo los archivos de manifiesto para cachear las dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

# Copiar el resto del código fuente
COPY . .

# Instalar todas las dependencias del monorepo
RUN pnpm install -r --offline

# Construir todo el monorepo
RUN pnpm run build


# ---- Fase 2: Runner (Producción) ----
FROM node:20-slim
WORKDIR /app

# Instalar 'serve' para servir los archivos estáticos
RUN npm install -g serve

# Copiar la carpeta 'dist' del cliente desde la fase de build
COPY --from=builder /app/apps/client/dist ./dist
# Copiar el archivo de configuración que necesita ser modificado
COPY --from=builder /app/apps/client/public/config.js ./dist/config.js

EXPOSE 3000

# Comando de inicio que primero reemplaza la variable y luego sirve la app
CMD ["sh", "-c", "sed -i 's|__VITE_API_BASE_URL__|'\"$VITE_API_BASE_URL\"'|g' dist/config.js && serve -s dist -l 3000"]