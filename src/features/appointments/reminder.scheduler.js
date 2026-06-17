const { sql, poolPromise } = require('../../config/db');
const MailService = require('./mail.service');

async function checkAndSendReminders() {
    try {
        const pool = await poolPromise;
        
        console.log("Checking for appointments scheduled for tomorrow to send reminders...");
        const result = await pool.request().query(`
            SELECT c.id_cita, c.fecha, c.hora_inicio, 
                   COALESCE(u.nombre, cl.nombre_invitado, 'Cliente General') as cliente_nombre,
                   COALESCE(u.email, cl.email_invitado) as cliente_email,
                   u_bar.nombre as barbero_nombre,
                   s.nombre as servicio_nombre
            FROM Citas c
            LEFT JOIN Clientes cl ON c.id_cliente = cl.id_cliente
            LEFT JOIN Usuarios u ON cl.id_usuario = u.id_usuario
            LEFT JOIN Barberos b ON c.id_barbero = b.id_barbero
            LEFT JOIN Usuarios u_bar ON b.id_usuario = u_bar.id_usuario
            LEFT JOIN Servicios s ON c.id_servicio = s.id_servicio
            WHERE c.estado NOT IN ('cancelada', 'cancelado', 'completada', 'completado')
              AND (c.recordatorio_enviado = 0 OR c.recordatorio_enviado IS NULL)
              AND CAST(c.fecha AS DATE) = CAST(DATEADD(day, 1, GETDATE()) AS DATE)
        `);

        const appointments = result.recordset;
        console.log(`Found ${appointments.length} appointments scheduled for tomorrow requiring reminders.`);

        for (const app of appointments) {
            if (app.cliente_email) {
                // Formatear hora
                let horaStr = '';
                if (app.hora_inicio) {
                    if (app.hora_inicio instanceof Date) {
                        horaStr = app.hora_inicio.toTimeString().substring(0, 5);
                    } else {
                        const match = app.hora_inicio.toString().match(/\d{2}:\d{2}/);
                        horaStr = match ? match[0] : app.hora_inicio.toString().substring(0, 5);
                    }
                }

                await MailService.sendReminderEmail({
                    email: app.cliente_email,
                    clientName: app.cliente_nombre,
                    serviceName: app.servicio_nombre || 'Servicio de Barbería',
                    barberName: app.barbero_nombre || 'Cualquier barbero disponible',
                    fecha: new Date(app.fecha).toLocaleDateString('es-ES', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    }),
                    hora: horaStr
                });

                // Actualizar recordatorio_enviado a 1
                await pool.request()
                    .input('id_cita', sql.Int, app.id_cita)
                    .query("UPDATE Citas SET recordatorio_enviado = 1 WHERE id_cita = @id_cita");
            }
        }
    } catch (error) {
        console.error("Error running checkAndSendReminders:", error.message);
    }
}

function startReminderScheduler() {
    // Ejecutar inmediatamente al iniciar
    checkAndSendReminders();
    
    // Y luego ejecutar cada 1 hora (3600000 ms)
    setInterval(checkAndSendReminders, 60 * 60 * 1000);
}

module.exports = { startReminderScheduler, checkAndSendReminders };
