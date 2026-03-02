require('dotenv').config();
const app = require('./src/app');
const { poolPromise } = require('./src/config/db'); // Inicializa la DB

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});