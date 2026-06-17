# 1. Usamos la imagen oficial completa de Node (incluye todas las herramientas de compilación por defecto)
FROM node:18

# 2. Creamos el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# 3. Copiamos los archivos de dependencias
COPY package*.json ./

# 4. Instalamos las dependencias
RUN npm install

# 5. Copiamos todo el código del proyecto
COPY . .

# 6. Exponemos el puerto
EXPOSE 4000

# 7. Comando para arrancar el backend
CMD ["npm", "start"]