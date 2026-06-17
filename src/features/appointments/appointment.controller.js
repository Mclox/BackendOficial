const AppointmentModel = require('./appointment.model');
const ClientModel = require('../clients/client.model');
const MailService = require('./mail.service');
const { sql, poolPromise } = require('../../config/db');

class AppointmentController {
    static async getPublicBusySlots(req, res) {
        try {
            const pool = await poolPromise;
            const result = await pool.request().query(`
                SELECT fecha, hora_inicio, hora_fin, id_barbero
                FROM Citas
                WHERE estado NOT IN ('cancelada', 'cancelado')
            `);
            const data = result.recordset.map(row => {
                const dateStr = row.fecha ? new Date(row.fecha).toISOString().split('T')[0] : '';
                
                // Formatear hora_inicio para quitar milisegundos/segundos si vienen de la BD
                let timeStr = '';
                if (row.hora_inicio) {
                    if (row.hora_inicio instanceof Date) {
                        timeStr = row.hora_inicio.toTimeString().substring(0, 5);
                    } else if (typeof row.hora_inicio === 'object' && row.hora_inicio.toISOString) {
                        timeStr = new Date(row.hora_inicio).toTimeString().substring(0, 5);
                    } else {
                        // Es un objeto time de mssql o string
                        const match = row.hora_inicio.toString().match(/\d{2}:\d{2}/);
                        timeStr = match ? match[0] : row.hora_inicio.toString().substring(0, 5);
                    }
                }

                // Formatear hora_fin
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
        const { clienteData, bookingData } = req.body;
        try {
            const pool = await poolPromise;

            if (!clienteData || !bookingData) {
                return res.status(400).json({ success: false, message: 'Datos incompletos para procesar la reserva.' });
            }

            // Validar que la fecha y hora no sean en el pasado
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
                // Barbero específico
                const conflictRes = await pool.request()
                    .input('id_barbero', sql.Int, parseInt(bookingData.id_barbero))
                    .input('fecha', sql.Date, bookingData.fecha)
                    .input('start', sql.VarChar, bookingData.hora_inicio)
                    .input('end', sql.VarChar, bookingData.hora_fin)
                    .query(`
                        SELECT COUNT(*) as count 
                        FROM Citas 
                        WHERE id_barbero = @id_barbero 
                          AND fecha = @fecha 
                          AND estado NOT IN ('cancelada', 'cancelado')
                          AND CAST(hora_inicio AS TIME) < CAST(@end AS TIME)
                          AND CAST(hora_fin AS TIME) > CAST(@start AS TIME)
                    `);
                if (conflictRes.recordset[0].count > 0) {
                    return res.status(400).json({ success: false, message: 'El barbero seleccionado no está disponible en este horario.' });
                }
            } else {
                // "Cualquier barbero disponible": validar que haya al menos un barbero activo libre
                const checkFreeRes = await pool.request()
                    .input('fecha', sql.Date, bookingData.fecha)
                    .input('start', sql.VarChar, bookingData.hora_inicio)
                    .input('end', sql.VarChar, bookingData.hora_fin)
                    .query(`
                        SELECT 
                            (SELECT COUNT(*) FROM Barberos WHERE estado = 'Activo') as total_active,
                            (SELECT COUNT(*) FROM Barberos b 
                             WHERE b.estado = 'Activo' 
                               AND b.id_barbero NOT IN (
                                   SELECT id_barbero 
                                   FROM Citas 
                                   WHERE fecha = @fecha 
                                     AND estado NOT IN ('cancelada', 'cancelado')
                                     AND id_barbero IS NOT NULL
                                     AND CAST(hora_inicio AS TIME) < CAST(@end AS TIME)
                                     AND CAST(hora_fin AS TIME) > CAST(@start AS TIME)
                               )) as free_active
                    `);
                const { total_active, free_active } = checkFreeRes.recordset[0];
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
                const checkRes = await pool.request()
                    .input('doc', sql.VarChar, clienteData.documento)
                    .query("SELECT id_cliente FROM Clientes WHERE documento = @doc");
                if (checkRes.recordset.length > 0) {
                    id_cliente = checkRes.recordset[0].id_cliente;
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

            // 4. Enviar Correo de Confirmación de forma asíncrona
            const servicesRes = await pool.request().query("SELECT id_servicio, nombre FROM Servicios");
            const serviceNames = bookingData.id_servicios.map(sId => {
                const s = servicesRes.recordset.find(x => x.id_servicio === parseInt(sId));
                return s ? s.nombre : 'Servicio';
            }).join(', ');

            let barberName = 'Cualquier barbero disponible';
            if (id_barbero_val) {
                const barbRes = await pool.request()
                    .input('id_barbero', sql.Int, id_barbero_val)
                    .query("SELECT u.nombre FROM Barberos b JOIN Usuarios u ON b.id_usuario = u.id_usuario WHERE b.id_barbero = @id_barbero");
                if (barbRes.recordset.length > 0) {
                    barberName = barbRes.recordset[0].nombre;
                }
            }

            // Llamar al servicio de correos sin esperar con await completo para responder rápido
            MailService.sendConfirmationEmail({
                email: clienteData.email,
                clientName: clienteData.nombre,
                serviceName: serviceNames,
                barberName: barberName,
                fecha: new Date(bookingData.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                }),
                hora: bookingData.hora_inicio
            }).catch(e => console.error("Error al enviar confirmación por correo:", e));

            res.status(201).json({ success: true, id_cita: newCitaId });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error procesando el agendamiento público', error: error.message });
        }
    }

    static async getAppointments(req, res) {
        try {
            const data = await AppointmentModel.getAll();
            res.json({ success: true, data });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async createAppointment(req, res) {
        try {
            const id = await AppointmentModel.create(req.body);
            res.status(201).json({ success: true, id_cita: id });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async updateAppointment(req, res) {
        try {
            const updated = await AppointmentModel.update(req.params.id, req.body);
            if (!updated) return res.status(404).json({ success: false, message: 'Cita no encontrada' });
            res.json({ success: true, message: 'Cita actualizada' });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async updateAppointmentStatus(req, res) {
        try {
            const { estado } = req.body;
            await AppointmentModel.updateStatus(req.params.id, estado);
            res.json({ success: true, message: 'Estado actualizado' });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async deleteAppointment(req, res) {
        try {
            const deleted = await AppointmentModel.delete(req.params.id);
            if (!deleted) return res.status(404).json({ success: false, message: 'Cita no encontrada' });
            res.json({ success: true, message: 'Cita eliminada' });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }
}
module.exports = AppointmentController;