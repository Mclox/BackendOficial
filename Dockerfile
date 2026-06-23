# Usamos la imagen oficial y ligera de Node
FROM node:20-alpine

# Directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copiamos los archivos de gestión de dependencias
COPY package*.json ./

# Instalamos solo las dependencias de producción (así la imagen es más rápida y ligera)
RUN npm install --only=production

# Copiamos el resto del código del backend
COPY . .

# Creamos la carpeta de uploads por si subes imágenes en la barbería
RUN mkdir -p uploads

# Exponemos el puerto en el que corre tu API (revisa si en tu .env usas el 5000 u otro)
EXPOSE 5000

# Comando para arrancar en producción
CMD ["npm", "start"]