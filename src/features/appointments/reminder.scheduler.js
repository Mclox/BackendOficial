const db = require('../../config/db');
const MailService = require('./mail.service');
const NotificationService = require('../notifications/notification.service');

async function checkAndSendReminders() {
    try {
        console.log("Checking for appointments scheduled for tomorrow to send reminders...");
        const result = await db.query(`
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
            WHERE c.estado NOT IN ('cancelada', 'cancelado', 'completada', 'completado', 'en-ejecucion', 'en ejecucion', 'en_ejecucion')
              AND (c.recordatorio_enviado = FALSE OR c.recordatorio_enviado IS NULL)
              AND c.fecha::date = CURRENT_DATE + 1
        `);

        const appointments = result.rows;
        if (appointments.length > 0) {
            console.log(`Found ${appointments.length} appointments scheduled for tomorrow requiring reminders.`);
        }

        for (const app of appointments) {
            if (app.cliente_email) {
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

                await db.query("UPDATE Citas SET recordatorio_enviado = TRUE WHERE id_cita = $1", [app.id_cita]);
            }
        }
    } catch (error) {
        console.error("Error running checkAndSendReminders:", error.message);
    }
}

async function checkAndSend30MinReminders() {
    try {
        console.log("Checking for appointments starting in the next 30 minutes to send reminders...");
        const result = await db.query(`
            SELECT c.id_cita, c.fecha, c.hora_inicio, 
                   COALESCE(u.nombre, cl.nombre_invitado, 'Cliente General') as cliente_nombre,
                   COALESCE(u.email, cl.email_invitado) as cliente_email,
                   u_bar.nombre as barbero_nombre,
                   u_bar.email as barbero_email,
                   s.nombre as servicio_nombre,
                   c.detalles_json
            FROM Citas c
            LEFT JOIN Clientes cl ON c.id_cliente = cl.id_cliente
            LEFT JOIN Usuarios u ON cl.id_usuario = u.id_usuario
            LEFT JOIN Barberos b ON c.id_barbero = b.id_barbero
            LEFT JOIN Usuarios u_bar ON b.id_usuario = u_bar.id_usuario
            LEFT JOIN Servicios s ON c.id_servicio = s.id_servicio
            WHERE c.estado NOT IN ('cancelada', 'cancelado', 'completada', 'completado', 'en-ejecucion', 'en ejecucion', 'en_ejecucion')
              AND (c.recordatorio_30m_enviado = FALSE OR c.recordatorio_30m_enviado IS NULL)
              AND ((c.fecha + c.hora_inicio::time) - LOCALTIMESTAMP) BETWEEN INTERVAL '0 minutes' AND INTERVAL '30 minutes'
        `);

        const appointments = result.rows;
        if (appointments.length > 0) {
            console.log(`Found ${appointments.length} appointments starting in the next 30 minutes requiring reminders.`);
        }

        for (const app of appointments) {
            let dateStr = app.fecha;
            if (app.fecha instanceof Date) {
                dateStr = app.fecha.toISOString().split('T')[0];
            }
            const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            });

            let horaStr = '';
            if (app.hora_inicio) {
                if (app.hora_inicio instanceof Date) {
                    horaStr = app.hora_inicio.toTimeString().substring(0, 5);
                } else {
                    const match = app.hora_inicio.toString().match(/\d{2}:\d{2}/);
                    horaStr = match ? match[0] : app.hora_inicio.toString().substring(0, 5);
                }
            }

            let serviceNames = app.servicio_nombre || 'Servicio';
            if (app.detalles_json) {
                try {
                    const detalles = typeof app.detalles_json === 'string' ? JSON.parse(app.detalles_json) : app.detalles_json;
                    if (detalles && detalles.servicios && detalles.servicios.length > 0) {
                        const hasNames = detalles.servicios.every(s => s.nombre);
                        if (hasNames) {
                            serviceNames = detalles.servicios.map(s => s.nombre).join(', ');
                        } else {
                            const servicesRes = await db.query("SELECT id_servicio, nombre FROM Servicios");
                            const matchedNames = detalles.servicios.map(ds => {
                                const s = servicesRes.rows.find(x => x.id_servicio === parseInt(ds.id_servicio));
                                return s ? s.nombre : 'Servicio';
                            });
                            if (matchedNames.length > 0) {
                                serviceNames = matchedNames.join(', ');
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error parsing detalles_json on reminder send:", e.message);
                }
            }

            const clientName = app.cliente_nombre || 'Cliente General';
            const barberName = app.barbero_nombre || 'Cualquier barbero disponible';

            if (app.cliente_email) {
                await MailService.sendCustomer30MinReminderEmail({
                    email: app.cliente_email,
                    clientName,
                    serviceName: serviceNames,
                    barberName,
                    fecha: formattedDate,
                    hora: horaStr
                });
            }

            if (app.barbero_email) {
                await MailService.sendBarberReminderEmail({
                    email: app.barbero_email,
                    clientName,
                    serviceName: serviceNames,
                    barberName,
                    fecha: formattedDate,
                    hora: horaStr
                });
            }

            await NotificationService.createNotification({
                modulo: 'Citas',
                accion: 'recordatorio',
                descripcion: `Recordatorio: Cita de "${clientName}" con "${barberName}" programada para hoy a las ${horaStr}.`,
                req: null
            });

            await db.query("UPDATE Citas SET recordatorio_30m_enviado = TRUE WHERE id_cita = $1", [app.id_cita]);
        }
    } catch (error) {
        console.error("Error running checkAndSend30MinReminders:", error.message);
    }
}

function startReminderScheduler() {
    checkAndSendReminders();
    setInterval(checkAndSendReminders, 60 * 60 * 1000);

    checkAndSend30MinReminders();
    setInterval(checkAndSend30MinReminders, 60 * 1000);
}

module.exports = { startReminderScheduler, checkAndSendReminders, checkAndSend30MinReminders };
