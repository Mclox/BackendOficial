const nodemailer = require('nodemailer');
const { sql, poolPromise } = require('../../config/db');

// Configuración del servicio de correo con Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

class MailService {
    /**
     * Envía un correo de confirmación de cita inmediatamente después del agendamiento.
     */
    static async sendConfirmationEmail({ email, clientName, serviceName, barberName, fecha, hora }) {
        if (!email) return;
        
        const mailOptions = {
            from: `"CzBarber" <${process.env.EMAIL_USER}>`,
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
            await transporter.sendMail(mailOptions);
            console.log(`📧 Correo de confirmación enviado exitosamente a ${email}`);
        } catch (error) {
            console.error(`❌ Error al enviar correo de confirmación a ${email}:`, error.message);
        }
    }

    /**
     * Envía un correo de recordatorio de cita (24 horas antes).
     */
    static async sendReminderEmail({ email, clientName, serviceName, barberName, fecha, hora }) {
        if (!email) return;

        const mailOptions = {
            from: `"CzBarber" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '⏰ Recordatorio de tu Cita de Mañana - CzBarber',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #d0d8e4; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <div style="background-color: #FF4B2B; color: white; padding: 24px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">¡Recordatorio de tu Cita! ⏰</h1>
                    </div>
                    <div style="padding: 24px; background-color: #ffffff; color: #333333; line-height: 1.6;">
                        <p style="font-size: 16px; margin-top: 0;">Hola <strong>${clientName}</strong>,</p>
                        <p>Te recordamos que tienes una cita programada para <strong>mañana</strong> en <strong>CzBarber</strong>:</p>
                        
                        <div style="background-color: #f9fafb; border-left: 4px solid #FF4B2B; padding: 16px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 4px 0;"><strong>Servicio(s):</strong> ${serviceName}</p>
                            <p style="margin: 4px 0;"><strong>Barbero:</strong> ${barberName || 'Cualquier barbero disponible'}</p>
                            <p style="margin: 4px 0;"><strong>Fecha:</strong> ${fecha}</p>
                            <p style="margin: 4px 0;"><strong>Hora:</strong> ${hora}</p>
                        </div>
                        
                        <p style="font-size: 14px; color: #555555;">¡Te esperamos! Si necesitas realizar cambios, contáctanos lo antes posible.</p>
                    </div>
                    <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #777777;">
                        &copy; 2026 CzBarber. Todos los derechos reservados.
                    </div>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`📧 Correo de recordatorio enviado exitosamente a ${email}`);
        } catch (error) {
            console.error(`❌ Error al enviar correo de recordatorio a ${email}:`, error.message);
        }
    }

    /**
     * Envía un correo de confirmación de cita al barbero asignado.
     */
    static async sendBarberConfirmationEmail({ email, clientName, serviceName, barberName, fecha, hora }) {
        if (!email) return;

        const mailOptions = {
            from: `"CzBarber" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '💈 Nueva Cita Asignada - CzBarber',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #d0d8e4; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <div style="background-color: #0057FF; color: white; padding: 24px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">¡Nueva Cita Asignada! 💈</h1>
                    </div>
                    <div style="padding: 24px; background-color: #ffffff; color: #333333; line-height: 1.6;">
                        <p style="font-size: 16px; margin-top: 0;">Hola <strong>${barberName}</strong>,</p>
                        <p>Se te ha asignado una nueva cita en <strong>CzBarber</strong>. A continuación los detalles:</p>
                        
                        <div style="background-color: #f3f4f6; border-left: 4px solid #0057FF; padding: 16px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 4px 0;"><strong>Cliente:</strong> ${clientName}</p>
                            <p style="margin: 4px 0;"><strong>Servicio(s):</strong> ${serviceName}</p>
                            <p style="margin: 4px 0;"><strong>Fecha:</strong> ${fecha}</p>
                            <p style="margin: 4px 0;"><strong>Hora:</strong> ${hora}</p>
                        </div>
                        
                        <p style="font-size: 14px; color: #555555;">Por favor asegúrate de estar preparado para este servicio a la hora indicada.</p>
                    </div>
                    <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #777777;">
                        &copy; 2026 CzBarber. Todos los derechos reservados.
                    </div>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`📧 Correo de confirmación enviado exitosamente al barbero ${email}`);
        } catch (error) {
            console.error(`❌ Error al enviar correo de confirmación al barbero ${email}:`, error.message);
        }
    }

    /**
     * Envía un correo de recordatorio de cita al barbero asignado.
     */
    static async sendBarberReminderEmail({ email, clientName, serviceName, barberName, fecha, hora }) {
        if (!email) return;

        const mailOptions = {
            from: `"CzBarber" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '⏰ Recordatorio de Cita Próxima - CzBarber',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #d0d8e4; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <div style="background-color: #FF4B2B; color: white; padding: 24px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">¡Recordatorio de Cita Próxima! ⏰</h1>
                    </div>
                    <div style="padding: 24px; background-color: #ffffff; color: #333333; line-height: 1.6;">
                        <p style="font-size: 16px; margin-top: 0;">Hola <strong>${barberName}</strong>,</p>
                        <p>Te recordamos que tienes una cita programada en <strong>30 minutos</strong> en <strong>CzBarber</strong>:</p>
                        
                        <div style="background-color: #f9fafb; border-left: 4px solid #FF4B2B; padding: 16px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 4px 0;"><strong>Cliente:</strong> ${clientName}</p>
                            <p style="margin: 4px 0;"><strong>Servicio(s):</strong> ${serviceName}</p>
                            <p style="margin: 4px 0;"><strong>Fecha:</strong> ${fecha}</p>
                            <p style="margin: 4px 0;"><strong>Hora:</strong> ${hora}</p>
                        </div>
                        
                        <p style="font-size: 14px; color: #555555;">Por favor mantente listo para recibir al cliente.</p>
                    </div>
                    <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #777777;">
                        &copy; 2026 CzBarber. Todos los derechos reservados.
                    </div>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`📧 Correo de recordatorio enviado exitosamente al barbero ${email}`);
        } catch (error) {
            console.error(`❌ Error al enviar correo de recordatorio al barbero ${email}:`, error.message);
        }
    }

    /**
     * Envía un correo de recordatorio de cita en 30 minutos al cliente.
     */
    static async sendCustomer30MinReminderEmail({ email, clientName, serviceName, barberName, fecha, hora }) {
        if (!email) return;

        const mailOptions = {
            from: `"CzBarber" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '⏰ Tu Cita Comienza en 30 Minutos - CzBarber',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #d0d8e4; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <div style="background-color: #FF4B2B; color: white; padding: 24px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">¡Tu Cita Comienza Pronto! ⏰</h1>
                    </div>
                    <div style="padding: 24px; background-color: #ffffff; color: #333333; line-height: 1.6;">
                        <p style="font-size: 16px; margin-top: 0;">Hola <strong>${clientName}</strong>,</p>
                        <p>Te recordamos que tu cita en <strong>CzBarber</strong> está programada para comenzar en <strong>30 minutos</strong>:</p>
                        
                        <div style="background-color: #f9fafb; border-left: 4px solid #FF4B2B; padding: 16px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 4px 0;"><strong>Servicio(s):</strong> ${serviceName}</p>
                            <p style="margin: 4px 0;"><strong>Barbero:</strong> ${barberName || 'Cualquier barbero disponible'}</p>
                            <p style="margin: 4px 0;"><strong>Fecha:</strong> ${fecha}</p>
                            <p style="margin: 4px 0;"><strong>Hora:</strong> ${hora}</p>
                        </div>
                        
                        <p style="font-size: 14px; color: #555555;">¡Te esperamos! Recuerda llegar a tiempo.</p>
                    </div>
                    <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #777777;">
                        &copy; 2026 CzBarber. Todos los derechos reservados.
                    </div>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`📧 Correo de recordatorio 30m enviado exitosamente a ${email}`);
        } catch (error) {
            console.error(`❌ Error al enviar correo de recordatorio 30m a ${email}:`, error.message);
        }
    }

    /**
     * Envía notificaciones de correo a cliente y barbero tras el registro de una cita.
     */
    static async sendNotificationOnCreation(id_cita) {
        try {
            const pool = await poolPromise;

            const result = await pool.request()
                .input('id', sql.Int, id_cita)
                .query(`
                    SELECT c.id_cita, c.fecha, c.hora_inicio, c.hora_fin, c.detalles_json,
                           COALESCE(u_cli.nombre, cl.nombre_invitado) as cliente_nombre,
                           COALESCE(u_cli.email, cl.email_invitado) as cliente_email,
                           u_bar.nombre as barbero_nombre,
                           u_bar.email as barbero_email,
                           s.nombre as servicio_nombre
                    FROM Citas c
                    LEFT JOIN Clientes cl ON c.id_cliente = cl.id_cliente
                    LEFT JOIN Usuarios u_cli ON cl.id_usuario = u_cli.id_usuario
                    LEFT JOIN Barberos b ON c.id_barbero = b.id_barbero
                    LEFT JOIN Usuarios u_bar ON b.id_usuario = u_bar.id_usuario
                    LEFT JOIN Servicios s ON c.id_servicio = s.id_servicio
                    WHERE c.id_cita = @id
                `);

            if (result.recordset.length === 0) {
                console.log(`Cita con ID ${id_cita} no encontrada para enviar notificaciones.`);
                return;
            }

            const row = result.recordset[0];

            // 1. Formatear Fecha
            let dateStr = row.fecha;
            if (row.fecha instanceof Date) {
                dateStr = row.fecha.toISOString().split('T')[0];
            }
            const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            });

            // 2. Formatear Hora
            let horaStr = '';
            if (row.hora_inicio) {
                if (row.hora_inicio instanceof Date) {
                    horaStr = row.hora_inicio.toTimeString().substring(0, 5);
                } else {
                    const match = row.hora_inicio.toString().match(/\d{2}:\d{2}/);
                    horaStr = match ? match[0] : row.hora_inicio.toString().substring(0, 5);
                }
            }

            // 3. Formatear Servicios
            let serviceNames = row.servicio_nombre || 'Servicio';
            if (row.detalles_json) {
                try {
                    const detalles = typeof row.detalles_json === 'string' ? JSON.parse(row.detalles_json) : row.detalles_json;
                    if (detalles && detalles.servicios && detalles.servicios.length > 0) {
                        const hasNames = detalles.servicios.every(s => s.nombre);
                        if (hasNames) {
                            serviceNames = detalles.servicios.map(s => s.nombre).join(', ');
                        } else {
                            const servicesRes = await pool.request().query("SELECT id_servicio, nombre FROM Servicios");
                            const matchedNames = detalles.servicios.map(ds => {
                                const s = servicesRes.recordset.find(x => x.id_servicio === parseInt(ds.id_servicio));
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

            const clientName = row.cliente_nombre || 'Cliente General';
            const barberName = row.barbero_nombre || 'Cualquier barbero disponible';

            // Enviar correo al Cliente
            if (row.cliente_email) {
                await this.sendConfirmationEmail({
                    email: row.cliente_email,
                    clientName,
                    serviceName: serviceNames,
                    barberName,
                    fecha: formattedDate,
                    hora: horaStr
                });
            }

            // Enviar correo al Barbero
            if (row.barbero_email) {
                await this.sendBarberConfirmationEmail({
                    email: row.barbero_email,
                    clientName,
                    serviceName: serviceNames,
                    barberName,
                    fecha: formattedDate,
                    hora: horaStr
                });
            }
        } catch (error) {
            console.error(`❌ Error en sendNotificationOnCreation para cita ID ${id_cita}:`, error.message);
        }
    }
}

module.exports = MailService;
