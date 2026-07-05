require('dotenv').config();
const app = require('./src/app');
const { poolPromise } = require('./src/config/db'); 
const { startReminderScheduler } = require('./src/features/appointments/reminder.scheduler');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    
    poolPromise.then(() => {
        console.log('📡 Sistema listo para recibir peticiones.');
        startReminderScheduler(); // Recordatorios activos y funcionando
    }).catch(err => {
        console.error('No se pudo conectar a la BD:', err.message);
    });
});