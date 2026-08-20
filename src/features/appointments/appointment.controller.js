const AppointmentModel = require('./appointment.model');
const ClientModel = require('../clients/client.model');
const MailService = require('./mail.service');
const db = require('../../config/db');
const NotificationService = require('../notifications/notification.service');

class AppointmentController {
    static async getPublicBusySlots(req, res) {
        try {
            const result = await db.query(`
                SELECT fecha, hora_inicio, hora_fin, id_barbero
                FROM Citas
                WHERE estado NOT IN ('cancelada', 'cancelado')
            `);
            const data = result.rows.map(row => {
                const dateStr = row.fecha ? new Date(row.fecha).toISOString().split('T')[0] : '';
                
                let timeStr = '';
                if (row.hora_inicio) {
                    if (row.hora_inicio instanceof Date) {
                        timeStr = row.hora_inicio.toTimeString().substring(0, 5);
                    } else if (typeof row.hora_inicio === 'object' && row.hora_inicio.toISOString) {
                        timeStr = new Date(row.hora_inicio).toTimeString().substring(0, 5);
                    } else {
                        const match = row.hora_inicio.toString().match(/\d{2}:\d{2}/);
                        timeStr = match ? match[0] : row.hora_inicio.toString().substring(0, 5);
                    }
                }

                let endTimeStr = '';
                if (row.hora_fin) {
                    if (row.hora_fin instanceof Date) {
                        endTimeStr = row.hora_fin.toTimeString().substring(0, 5);
                    } else if (typeof row.hora_fin === 'object' && row.hora_fin.toISOString) {
                        endTimeStr = new Date(row.hora_fin).toTimeString().substring(0, 5);
                    } else {
                        const match = row.hora_fin.toString().match(/\d{2}:\d{2}/);
                        endTimeStr = match ? match[0] : row.hora_fin.toString().substring(0, 5);
                    }
                }

                return {
                    fecha: dateStr,
                    hora: timeStr,
                    hora_fin: endTimeStr,
                    id_barbero: row.id_barbero
                };
            });
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async createPublicBooking(req, res) {
        const clienteData = req.body.clienteData || req.body.cliente || { nombre: 'Cliente', email: 'cliente@barber.com' };
        const bookingData = req.body.bookingData || req.body.booking || req.body;
        try {
            if (!clienteData || !bookingData || !bookingData.fecha || !bookingData.hora_inicio) {
                return res.status(400).json({ success: false, message: 'Datos incompletos para procesar la reserva.' });
            }

            if (!bookingData.id_servicios && bookingData.id_servicio) {
                bookingData.id_servicios = [bookingData.id_servicio];
            }

            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;
            const currentMins = today.getHours() * 60 + today.getMinutes();

            if (bookingData.fecha < todayStr) {
                return res.status(400).json({ success: false, message: 'No se pueden agendar citas en fechas anteriores a la fecha actual.' });
            }

            if (bookingData.fecha === todayStr) {
                const [hh, mm] = bookingData.hora_inicio.split(':').map(Number);
                const startMins = hh * 60 + mm;
                if (startMins < currentMins) {
                    return res.status(400).json({ success: false, message: 'No se pueden agendar citas en horarios que ya han pasado hoy.' });
                }
            }

            // 1. Validar conflicto de horarios
            if (bookingData.id_barbero && parseInt(bookingData.id_barbero) !== 0) {
                const conflictRes = await db.query(`
                    SELECT COUNT(*)::int as count 
                    FROM Citas 
                    WHERE id_barbero = $1 
                      AND fecha = $2 
                      AND estado NOT IN ('cancelada', 'cancelado')
                      AND hora_inicio::time < $3::time
                      AND hora_fin::time > $4::time
                `, [parseInt(bookingData.id_barbero), bookingData.fecha, bookingData.hora_fin, bookingData.hora_inicio]);
                
                if (conflictRes.rows[0].count > 0) {
                    return res.status(400).json({ success: false, message: 'El barbero seleccionado no está disponible en este horario.' });
                }
            } else {
                const checkFreeRes = await db.query(`
                    SELECT 
                        (SELECT COUNT(*) FROM Barberos WHERE estado = 'Activo')::int as total_active,
                        (SELECT COUNT(*) FROM Barberos b 
                         WHERE b.estado = 'Activo' 
                           AND b.id_barbero NOT IN (
                               SELECT id_barbero 
                               FROM Citas 
                               WHERE fecha = $1 
                                 AND estado NOT IN ('cancelada', 'cancelado')
                                 AND id_barbero IS NOT NULL
                                 AND hora_inicio::time < $2::time
                                 AND hora_fin::time > $3::time
                           ))::int as free_active
                `, [bookingData.fecha, bookingData.hora_fin, bookingData.hora_inicio]);
                
                const { total_active, free_active } = checkFreeRes.rows[0];
                if (total_active === 0) {
                    return res.status(400).json({ success: false, message: 'No hay barberos activos registrados en el sistema.' });
                }
                if (free_active === 0) {
                    return res.status(400).json({ success: false, message: 'No hay barberos disponibles en el horario seleccionado.' });
                }
            }

            // 2. Crear o verificar el cliente invitado
            let id_cliente = null;
            if (clienteData.documento) {
                const checkRes = await db.query("SELECT id_cliente FROM Clientes WHERE documento = $1", [clienteData.documento]);
                if (checkRes.rows.length > 0) {
                    id_cliente = checkRes.rows[0].id_cliente;
                }
            }

            if (!id_cliente) {
                id_cliente = await ClientModel.create({
                    nombre_invitado: clienteData.nombre,
                    email_invitado: clienteData.email,
                    telefono_invitado: clienteData.telefono,
                    tipo_documento: clienteData.tipo_documento,
                    documento: clienteData.documento
                });
            }

            // 3. Crear la Cita
            const id_barbero_val = (bookingData.id_barbero && parseInt(bookingData.id_barbero) !== 0) 
                ? parseInt(bookingData.id_barbero) 
                : null;
            
            const firstServiceId = (bookingData.id_servicios && bookingData.id_servicios.length > 0)
                ? parseInt(bookingData.id_servicios[0])
                : null;

            const newCitaId = await AppointmentModel.create({
                id_cliente,
                id_barbero: id_barbero_val,
                id_servicio: firstServiceId,
                fecha: bookingData.fecha,
                hora_inicio: bookingData.hora_inicio,
                hora_fin: bookingData.hora_fin,
                detalles_json: {
                    servicios: bookingData.id_servicios.map(sId => ({ id_servicio: parseInt(sId), cantidad: 1 })),
                    productos: []
                }
            });

            // Enviar notificaciones por correo electrónico de forma asíncrona a cliente y barbero
            MailService.sendNotificationOnCreation(newCitaId).catch(e => console.error("Error al enviar notificaciones de confirmación:", e));

            await NotificationService.createNotification({
                modulo: 'Citas',
                accion: 'creacion',
                descripcion: `Se reservó una cita pública para "${clienteData.nombre}" el ${bookingData.fecha} a las ${bookingData.hora_inicio}.`,
                req
            });

            res.status(201).json({ success: true, id_cita: newCitaId });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error procesando el agendamiento público', error: error.message });
        }
    }

    static async getAppointments(req, res) {
        try {
            let data = await AppointmentModel.getAll();
            if (req.user && req.user.rol === 'Cliente') {
                const clientRes = await db.query('SELECT id_cliente FROM Clientes WHERE id_usuario = $1', [req.user.id]);
                if (clientRes.rows.length > 0) {
                    const id_cliente = clientRes.rows[0].id_cliente;
                    data = data.filter(c => c.id_cliente === id_cliente);
                } else {
                    data = [];
                }
            } else if (req.user && req.user.rol === 'Barbero') {
                const barberoRes = await db.query('SELECT id_barbero FROM Barberos WHERE id_usuario = $1', [req.user.id]);
                if (barberoRes.rows.length > 0) {
                    const id_barbero = barberoRes.rows[0].id_barbero;
                    data = data.filter(c => c.id_barbero === id_barbero);
                } else {
                    data = [];
                }
            }
            res.json({ success: true, data });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async createAppointment(req, res) {
        try {
            const body = { ...req.body };

            // Si el usuario autenticado es un Cliente, resolver su id_cliente real de la BD
            if (req.user && (req.user.rol === 'Cliente' || req.user.rol === 'client')) {
                const clientRes = await db.query('SELECT id_cliente FROM Clientes WHERE id_usuario = $1', [req.user.id]);
                if (clientRes.rows.length > 0) {
                    body.id_cliente = clientRes.rows[0].id_cliente;
                } else {
                    const insRes = await db.query(
                        "INSERT INTO Clientes (id_usuario, nombre_invitado, fecha_registro) VALUES ($1, $2, CURRENT_DATE) RETURNING id_cliente",
                        [req.user.id, req.user.email || 'Cliente Registrado']
                    );
                    if (insRes.rows.length > 0) {
                        body.id_cliente = insRes.rows[0].id_cliente;
                    }
                }
            }

            const id = await AppointmentModel.create(body);
            
            MailService.sendNotificationOnCreation(id).catch(e => console.error("Error al enviar notificaciones de confirmación:", e));

            await NotificationService.createNotification({
                modulo: 'Citas',
                accion: 'creacion',
                descripcion: `Se agendó una nueva cita (ID: ${id}) para la fecha ${body.fecha} a las ${body.hora_inicio}.`,
                req
            }).catch(e => console.error("Error al crear notificación de cita:", e));

            res.status(201).json({ success: true, id_cita: id });
        } catch (error) { 
            console.error("Error en createAppointment:", error);
            res.status(500).json({ success: false, error: error.message }); 
        }
    }

    static async updateAppointment(req, res) {
        try {
            const updated = await AppointmentModel.update(req.params.id, req.body);
            if (!updated) return res.status(404).json({ success: false, message: 'Cita no encontrada' });
            await NotificationService.createNotification({
                modulo: 'Citas',
                accion: 'edicion',
                descripcion: `Se actualizó la cita con ID ${req.params.id} (Fecha: ${req.body.fecha}).`,
                req
            });
            res.json({ success: true, message: 'Cita actualizada' });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async updateAppointmentStatus(req, res) {
        try {
            const { estado } = req.body;
            await AppointmentModel.updateStatus(req.params.id, estado);
            await NotificationService.createNotification({
                modulo: 'Citas',
                accion: 'cambio_estado',
                descripcion: `Se cambió el estado de la cita con ID ${req.params.id} a "${estado}".`,
                req
            });
            res.json({ success: true, message: 'Estado actualizado' });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async deleteAppointment(req, res) {
        try {
            const deleted = await AppointmentModel.delete(req.params.id);
            if (!deleted) return res.status(404).json({ success: false, message: 'Cita no encontrada' });
            await NotificationService.createNotification({
                modulo: 'Citas',
                accion: 'eliminacion',
                descripcion: `Se eliminó/canceló la cita con ID ${req.params.id}.`,
                req
            });
            res.json({ success: true, message: 'Cita eliminada' });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }
}

module.exports = AppointmentController;