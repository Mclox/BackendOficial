const nodemailer = require('nodemailer');
const db = require('../../config/db');

// Configuración flexible y robusta del servicio de correo SMTP (Soporta Gmail y SMTP personalizado para producción)
const getTransporter = () => {
    const user = (process.env.EMAIL_USER || '').trim();
    const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
    const host = (process.env.EMAIL_HOST || '').trim();
    const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : undefined;
    const secure = process.env.EMAIL_SECURE !== undefined 
        ? (process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_SECURE === true)
        : (port === 465);

    // Si se especificó un host SMTP personalizado (ej: Render, DigitalOcean, Brevo, SendGrid, Amazon SES)
    if (host) {
        return nodemailer.createTransport({
            host,
            port: port || 587,
            secure,
            auth: {
                user,
                pass
            },
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 15000,
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    // Por defecto usa el servicio Gmail con las credenciales de la app
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user,
            pass
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
        tls: {
            rejectUnauthorized: false
        }
    });
};

const getFromAddress = () => {
    const user = (process.env.EMAIL_USER || '').trim();
    return process.env.EMAIL_FROM || `"CzBarber" <${user}>`;
};

class MailService {
    /**
     * Verifica la conectividad con el servidor SMTP.
     */
    static async verifyConnection() {
        const user = (process.env.EMAIL_USER || '').trim();
        const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

        if (!user || !pass) {
            return {
                success: false,
                message: 'EMAIL_USER o EMAIL_PASS no están configurados en las variables de entorno.'
            };
        }

        try {
            const transporter = getTransporter();
            await transporter.verify();
            return {
                success: true,
                message: `Servidor SMTP autenticado y listo para enviar correos desde ${user}.`
            };
        } catch (error) {
            return {
                success: false,
                message: `Fallo en verificación SMTP: ${error.message}`
            };
        }
    }

    /**
     * Envía un correo de confirmación de cita al cliente inmediatamente tras el agendamiento.
     */
    static async sendConfirmationEmail({ email, clientName, serviceName, barberName, fecha, hora }) {
        if (!email || !email.trim()) {
            const msg = 'No se proporcionó correo de destinatario para enviar la confirmación.';
            console.warn(`⚠️ ${msg}`);
            return { success: false, error: msg, accepted: [], rejected: [] };
        }

        const user = (process.env.EMAIL_USER || '').trim();
        const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

        if (!user || !pass) {
            const msg = 'EMAIL_USER o EMAIL_PASS no están configurados en las variables de entorno del backend.';
            console.warn(`⚠️ Advertencia: ${msg}`);
            return { success: false, error: msg, accepted: [], rejected: [email] };
        }
        
        const mailOptions = {
            from: getFromAddress(),
            to: email.trim(),
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
            console.log(`📧 Correo de confirmación enviado exitosamente a ${email}. ID: ${info?.messageId} - Respuesta: ${info?.response}`);
            return {
                success: true,
                messageId: info?.messageId,
                accepted: info?.accepted || [email],
                rejected: info?.rejected || [],
                response: info?.response,
                error: null
            };
        } catch (error) {
            console.error(`❌ Error al enviar correo de confirmación a ${email}:`, error.message);
            return {
                success: false,
                messageId: null,
                accepted: [],
                rejected: [email],
                error: error.message
            };
        }
    }

    /**
     * Envía un correo de notificación al barbero asignado.
     */
    static async sendBarberConfirmationEmail({ email, clientName, serviceName, barberName, fecha, hora }) {
        if (!email) return { success: false, error: 'Sin correo de barbero' };

        const user = (process.env.EMAIL_USER || '').trim();
        const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
        if (!user || !pass) return { success: false, error: 'Credenciales de correo no configuradas' };

        const mailOptions = {
            from: getFromAddress(),
            to: email.trim(),
            subject: '💈 Nueva Cita Asignada - CzBarber',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #d0d8e4; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #0057FF; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 20px;">¡Nueva Cita Asignada! 💈</h1>
                    </div>
                    <div style="padding: 20px; background-color: #ffffff;">
                        <p>Hola <strong>${barberName}</strong>,</p>
                        <p>Se ha reservado una nueva cita en tu horario:</p>
                        <p>• <strong>Cliente:</strong> ${clientName}<br/>• <strong>Servicio:</strong> ${serviceName}<br/>• <strong>Fecha:</strong> ${fecha}<br/>• <strong>Hora:</strong> ${hora}</p>
                    </div>
                    <div style="background-color: #f9fafb; padding: 12px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 11px; color: #777;">
                        &copy; 2026 CzBarber.
                    </div>
                </div>
            `
        };

        try {
            const transporter = getTransporter();
            const info = await transporter.sendMail(mailOptions);
            return { success: true, messageId: info?.messageId };
        } catch (error) {
            console.error(`❌ Error enviando correo al barbero ${email}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Envía un correo de recordatorio (día antes) al cliente.
     */
    static async sendReminderEmail({ email, clientName, serviceName, barberName, fecha, hora }) {
        if (!email) return { success: false, error: 'Sin correo de cliente' };

        const mailOptions = {
            from: getFromAddress(),
            to: email.trim(),
            subject: '💈 Recordatorio de tu Cita - CzBarber',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #d0d8e4; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #0057FF; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 20px;">Recordatorio de Cita 💈</h1>
                    </div>
                    <div style="padding: 20px; background-color: #ffffff;">
                        <p>Hola <strong>${clientName}</strong>,</p>
                        <p>Te recordamos que tienes una cita agendada para el día de mañana:</p>
                        <p>• <strong>Servicio:</strong> ${serviceName}<br/>• <strong>Barbero:</strong> ${barberName}<br/>• <strong>Fecha:</strong> ${fecha}<br/>• <strong>Hora:</strong> ${hora}</p>
                    </div>
                </div>
            `
        };

        try {
            const transporter = getTransporter();
            const info = await transporter.sendMail(mailOptions);
            return { success: true, messageId: info?.messageId };
        } catch (error) {
            console.error(`❌ Error enviando recordatorio a ${email}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Envía un correo de recordatorio (30 minutos antes) al cliente.
     */
    static async sendCustomer30MinReminderEmail({ email, clientName, serviceName, barberName, fecha, hora }) {
        if (!email) return { success: false, error: 'Sin correo de cliente' };

        const mailOptions = {
            from: getFromAddress(),
            to: email.trim(),
            subject: '⏰ Tu cita comienza en 30 minutos - CzBarber',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #d0d8e4; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #FF8A00; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 20px;">¡Tu Cita es en 30 Minutos! ⏰</h1>
                    </div>
                    <div style="padding: 20px; background-color: #ffffff;">
                        <p>Hola <strong>${clientName}</strong>,</p>
                        <p>Tu cita con <strong>${barberName}</strong> comenzará pronto:</p>
                        <p>• <strong>Servicio:</strong> ${serviceName}<br/>• <strong>Hora:</strong> ${hora}</p>
                        <p>Por favor preséntate 5 minutos antes.</p>
                    </div>
                </div>
            `
        };

        try {
            const transporter = getTransporter();
            const info = await transporter.sendMail(mailOptions);
            return { success: true, messageId: info?.messageId };
        } catch (error) {
            console.error(`❌ Error enviando recordatorio 30m a ${email}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Envía un correo de recordatorio (30 minutos antes) al barbero.
     */
    static async sendBarberReminderEmail({ email, clientName, serviceName, barberName, fecha, hora }) {
        if (!email) return { success: false, error: 'Sin correo de barbero' };

        const mailOptions = {
            from: getFromAddress(),
            to: email.trim(),
            subject: '⏰ Cita en 30 minutos - CzBarber',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #d0d8e4; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #FF8A00; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 20px;">Cita Próxima en 30 Minutos ⏰</h1>
                    </div>
                    <div style="padding: 20px; background-color: #ffffff;">
                        <p>Hola <strong>${barberName}</strong>,</p>
                        <p>Tienes una cita programada para dentro de 30 minutos:</p>
                        <p>• <strong>Cliente:</strong> ${clientName}<br/>• <strong>Servicio:</strong> ${serviceName}<br/>• <strong>Hora:</strong> ${hora}</p>
                    </div>
                </div>
            `
        };

        try {
            const transporter = getTransporter();
            const info = await transporter.sendMail(mailOptions);
            return { success: true, messageId: info?.messageId };
        } catch (error) {
            console.error(`❌ Error enviando recordatorio 30m al barbero ${email}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Envía notificaciones de correo a cliente y barbero tras el registro de una cita.
     * Retorna un objeto con el resultado detallado del envío al cliente.
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
                console.warn(`⚠️ Cita con ID ${id_cita} no encontrada para enviar notificaciones.`);
                return { success: false, error: `Cita con ID ${id_cita} no encontrada en la base de datos.` };
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
                    const match = row.hora_inicio.toString().match(/\d{2}:\d{2}/);
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

            let clientEmailResult = {
                success: false,
                error: `No se encontró un correo electrónico registrado para el cliente "${clientName}".`
            };

            // 1. Enviar correo de confirmación al cliente y confirmar entrega
            if (row.cliente_email && row.cliente_email.trim()) {
                clientEmailResult = await this.sendConfirmationEmail({
                    email: row.cliente_email.trim(),
                    clientName,
                    serviceName: serviceNames,
                    barberName,
                    fecha: formattedDate,
                    hora: horaStr
                });
            } else {
                console.warn(`⚠️ Cita #${id_cita}: No se encontró correo para el cliente (${clientName}).`);
            }

            // 2. Enviar correo al barbero asignado si tiene correo registrado
            if (row.barbero_email && row.barbero_email.trim()) {
                this.sendBarberConfirmationEmail({
                    email: row.barbero_email.trim(),
                    clientName,
                    serviceName: serviceNames,
                    barberName,
                    fecha: formattedDate,
                    hora: horaStr
                }).catch(e => console.error("Error enviando correo al barbero:", e.message));
            }

            return clientEmailResult;
        } catch (error) {
            console.error(`❌ Error en sendNotificationOnCreation para cita ID ${id_cita}:`, error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = MailService;
