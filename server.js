require('dotenv').config();
const app = require('./src/app');
// Importar la base de datos es importante para que el trigger de conexión se dispare
const { poolPromise } = require('./src/config/db'); 
const { startReminderScheduler } = require('./src/features/appointments/reminder.scheduler');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    
    // Iniciar planificador de recordatorios después de conectar a la BD
    poolPromise.then(() => {
        startReminderScheduler();
    }).catch(err => {
        console.error('No se pudo iniciar el planificador de recordatorios:', err.message);
    });
});