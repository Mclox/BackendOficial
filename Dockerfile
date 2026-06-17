# 1. Usamos la imagen oficial completa de Node 18
FROM node:18

# 2. Instalamos unixodbc-dev que es obligatorio para que 'msnodesqlv8' compile en Linux
RUN apt-get update && apt-get install -y \
    unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

# 3. Creamos el directorio de trabajo
WORKDIR /usr/src/app

# 4. Copiamos los archivos de dependencias
COPY package*.json ./

# 5. Instalamos las dependencias
RUN npm install

# 6. Copiamos todo el código del proyecto
COPY . .

# 7. Exponemos el puerto
EXPOSE 4000

# 8. Comando para arrancar el backend
CMD ["npm", "start"]