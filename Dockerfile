# 1. Cambiamos a una imagen base basada en Debian, que es más robusta para compilar módulos nativos
FROM node:18-slim

# 2. Instalamos las herramientas de compilación esenciales en Debian
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 3. Creamos el directorio de trabajo
WORKDIR /usr/src/app

# 4. Copiamos los archivos de dependencias
COPY package*.json ./

# 5. Instalamos dependencias limpiando cualquier rastro previo
RUN npm install

# 6. Copiamos el resto del código
COPY . .

# 7. Exponemos el puerto
EXPOSE 4000

# 8. Arrancamos el servicio
CMD ["npm", "start"]