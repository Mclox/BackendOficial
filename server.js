require('dotenv').config();
const app = require('./src/app');
// Importar la base de datos es importante para que el trigger de conexión se dispare
const { poolPromise } = require('./src/config/db'); 

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});