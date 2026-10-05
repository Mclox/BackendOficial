const nodemailer = require('nodemailer');
const db = require('../../config/db');
const WhatsAppService = require('./whatsapp.service');

// Configuración robusta del servicio de correo con Gmail SMTP
const getTransporter = () => {
    const user = (process.env.EMAIL_USER || '').trim();
    const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user,
            pass
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        tls: {
            rejectUnauthorized: false
        }
    });
};

class MailService {
    /**
     * Envía un correo de confirmación de cita inmediatamente después del agendamiento.
     */
    static async sendConfirmationEmail({ email, clientName, serviceName, barberName, fecha, hora }) {
        if (!email) {
            console.warn('⚠️ No se proporcionó correo de destinatario para enviar la confirmación.');
            return false;
        }

        const user = (process.env.EMAIL_USER || '').trim();
        const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

        if (!user || !pass) {
            console.warn('⚠️ Advertencia: EMAIL_USER o EMAIL_PASS no están configurados en las variables de entorno del backend.');
            return false;
        }
        
        const mailOptions = {
            from: `"CzBarber" <${user}>`,
            to: email,
            subject: '💈 Confirmación de tu Cita - CzBarber',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #d0d8e4; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <div style="background-color: #0057FF; color: white; padding: 24px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">¡Cita Confirmada! 💈</h1>
                    </div>
                    <div style="padding: 24px; background-color: #ffffff; color: #333333; line-height: 1.6;">
                        <p style="font-size: 16px; margin-top: 0;">Hola <strong>${clientName}</strong>,</p>
                        <p>Tu cita en <strong>CzBarber</strong> ha sido agendada con éxito. A continuación te presentamos los detalles del servicio:</p>
                        
                        <div style="background-color: #f3f4f6; border-left: 4px solid #0057FF; padding: 16px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 4px 0;"><strong>Servicio(s):</strong> ${serviceName}</p>
                            <p style="margin: 4px 0;"><strong>Barbero:</strong> ${barberName || 'Cualquier barbero disponible'}</p>
                            <p style="margin: 4px 0;"><strong>Fecha:</strong> ${fecha}</p>
                            <p style="margin: 4px 0;"><strong>Hora:</strong> ${hora}</p>
                        </div>
                        
                        <p style="font-size: 14px; color: #555555;">Recuerda asistir 5 minutos antes de la hora acordada. Si deseas reprogramar o cancelar tu cita, contáctanos al menos con 2 horas de anticipación.</p>
                    </div>
                    <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #777777;">
                        &copy; 2026 CzBarber. Todos los derechos reservados.
                    </div>
                </div>
            `
        };

        try {
            const transporter = getTransporter();
            const info = await transporter.sendMail(mailOptions);
            console.log(`📧 Correo de confirmación enviado exitosamente a ${email}. ID: ${info?.messageId}`);
            return true;
        } catch (error) {
            console.error(`❌ Error al enviar correo de confirmación a ${email}:`, error.message);
            return false;
        }
    }

    /**
     * Envía notificaciones de correo a cliente y barbero tras el registro de una cita.
     * Retorna true si el correo de confirmación al cliente fue despachado exitosamente.
     */
    static async sendNotificationOnCreation(id_cita) {
        try {
            const result = await db.query(`
                SELECT c.id_cita, c.fecha, c.hora_inicio, c.hora_fin, c.detalles_json,
                       COALESCE(u_cli.nombre, cl.nombre_invitado) as cliente_nombre,
                       COALESCE(u_cli.email, cl.email_invitado) as cliente_email,
                       COALESCE(u_cli.telefono, cl.telefono_invitado) as cliente_telefono,
                       u_bar.nombre as barbero_nombre,
                       u_bar.email as barbero_email,
                       u_bar.telefono as barbero_telefono,
                       s.nombre as servicio_nombre
                FROM Citas c
                LEFT JOIN Clientes cl ON c.id_cliente = cl.id_cliente
                LEFT JOIN Usuarios u_cli ON cl.id_usuario = u_cli.id_usuario
                LEFT JOIN Barberos b ON c.id_barbero = b.id_barbero
                LEFT JOIN Usuarios u_bar ON b.id_usuario = u_bar.id_usuario
                LEFT JOIN Servicios s ON c.id_servicio = s.id_servicio
                WHERE c.id_cita = $1
            `, [id_cita]);

            if (result.rows.length === 0) {
                console.log(`Cita con ID ${id_cita} no encontrada para enviar notificaciones.`);
                return false;
            }

            const row = result.rows[0];

            let dateStr = row.fecha;
            if (row.fecha instanceof Date) {
                dateStr = row.fecha.toISOString().split('T')[0];
            }
            const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            });

            let horaStr = '';
            if (row.hora_inicio) {
                if (row.hora_inicio instanceof Date) {
                    horaStr = row.hora_inicio.toTimeString().substring(0, 5);
                } else {
                    const match = row.hora_inicio.toString().match(/\\d{2}:\\d{2}/);
                    horaStr = match ? match[0] : row.hora_inicio.toString().substring(0, 5);
                }
            }

            let serviceNames = row.servicio_nombre || 'Servicio';
            if (row.detalles_json) {
                try {
                    const detalles = typeof row.detalles_json === 'string' ? JSON.parse(row.detalles_json) : row.detalles_json;
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
                    console.error("Error parsing detalles_json on email send:", e.message);
                }
            }

            const clientName = (row.cliente_nombre || 'Cliente').trim();
            const barberName = (row.barbero_nombre || 'Cualquier barbero disponible').trim();

            let clientEmailSent = false;

            // 1. Enviar correo de confirmación al cliente
            if (row.cliente_email) {
                clientEmailSent = await this.sendConfirmationEmail({
                    email: row.cliente_email,
                    clientName,
                    serviceName: serviceNames,
                    barberName,
                    fecha: formattedDate,
                    hora: horaStr
                });
            } else {
                console.warn(`⚠️ Cita #${id_cita}: No se encontró correo para el cliente (${clientName}).`);
            }

            // 2. Enviar correo al barbero asignado si tiene correo
            if (row.barbero_email) {
                const mailOptionsBarber = {
                    from: `"CzBarber" <${(process.env.EMAIL_USER || '').trim()}>`,
                    to: row.barbero_email,
                    subject: '💈 Nueva Cita Asignada - CzBarber',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #d0d8e4; border-radius: 12px; overflow: hidden;">
                            <div style="background-color: #0057FF; color: white; padding: 20px; text-align: center;">
                                <h1 style="margin: 0; font-size: 20px;">¡Nueva Cita Asignada! 💈</h1>
                            </div>
                            <div style="padding: 20px; background-color: #ffffff;">
                                <p>Hola <strong>${barberName}</strong>,</p>
                                <p>Se ha reservado una nueva cita en tu horario:</p>
                                <p>• <strong>Cliente:</strong> ${clientName}<br/>• <strong>Servicio:</strong> ${serviceNames}<br/>• <strong>Fecha:</strong> ${formattedDate}<br/>• <strong>Hora:</strong> ${horaStr}</p>
                            </div>
                        </div>
                    `
                };
                getTransporter().sendMail(mailOptionsBarber).catch(e => console.error("Error enviando correo al barbero:", e.message));
            }

            return Boolean(clientEmailSent);
        } catch (error) {
            console.error(`❌ Error en sendNotificationOnCreation para cita ID ${id_cita}:`, error.message);
            return false;
        }
    }
}

module.exports = MailService;
