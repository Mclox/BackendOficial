# 1. Usamos una versión estable de Node
FROM node:18-alpine

# 2. Instalamos herramientas necesarias para compilar bases de datos (SQL Server)
RUN apk add --no-cache python3 make g++

# 3. Creamos y nos ubicamos en la carpeta de la app dentro del contenedor
WORKDIR /usr/src/app

# 4. Copiamos los archivos de dependencias
COPY package*.json ./

# 5. Limpiamos caché de npm e instalamos las dependencias desde cero
RUN npm cache clean --force && npm install

# 6. Copiamos el resto del código del proyecto
COPY . .

# 7. Exponemos el puerto 4000 (el que tienes en tu archivo)
EXPOSE 4000

# 8. Comando para arrancar la aplicación
CMD ["npm", "start"]