const nodemailer = require('nodemailer');
const db = require('../../config/db');

// Configuración flexible y robusta del servicio de correo SMTP (Soporta Gmail y SMTP personalizado)
const getTransporter = () => {
    const user = (process.env.EMAIL_USER || '').trim();
    const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
    const host = (process.env.EMAIL_HOST || '').trim();
    const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : undefined;
    const secure = process.env.EMAIL_SECURE !== undefined 
        ? (process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_SECURE === true)
        : (port === 465);

    // Si se especificó un host SMTP personalizado (ej: VPS, DigitalOcean, Amazon SES)
    if (host) {
        return nodemailer.createTransport({
            host,
            port: port || 587,
            secure,
            auth: { user, pass },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
            tls: { rejectUnauthorized: false }
        });
    }

    // Por defecto usa el servicio Gmail con las credenciales de la app
    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        tls: { rejectUnauthorized: false }
    });
};

const getFromAddress = () => {
    const user = (process.env.EMAIL_USER || '').trim();
    return process.env.EMAIL_FROM || `"CzBarber" <${user}>`;
};

class MailService {
    /**
     * Motor unificado de despacho de correos:
     * 1. Si existe BREVO_API_KEY, RESEND_API_KEY o SENDGRID_API_KEY, despacha por HTTPS (Puerto 443).
     *    Esto es vital para entornos como Render Free Tier donde los puertos SMTP 25, 465 y 587 están bloqueados.
     * 2. Si no hay API Key HTTP, utiliza SMTP estándar (Nodemailer).
     */
    static async dispatchMail({ to, subject, html, recipientName = 'Cliente' }) {
        const destEmail = (to || '').trim();
        if (!destEmail) {
            return { success: false, error: 'No se especificó correo de destinatario.', accepted: [], rejected: [] };
        }

        const senderEmail = (process.env.EMAIL_USER || 'miguelangelcardonalopez0@gmail.com').trim();
        const fromHeader = getFromAddress();

        let lastError = null;

        // Auto-detección inteligente de tipo de API key (Resend empieza con 're_', Brevo con 'xkeysib-')
        const rawBrevo = (process.env.BREVO_API_KEY || '').trim();
        const rawResend = (process.env.RESEND_API_KEY || '').trim();
        const rawGeneric = (process.env.EMAIL_API_KEY || '').trim();

        const resendKey = rawResend || (rawBrevo.startsWith('re_') ? rawBrevo : null) || (rawGeneric.startsWith('re_') ? rawGeneric : null);
        const brevoKey = (rawBrevo && !rawBrevo.startsWith('re_')) ? rawBrevo : (rawResend.startsWith('xkeysib-') ? rawResend : null) || (rawGeneric.startsWith('xkeysib-') ? rawGeneric : null);

        // --- OPCIÓN 1: Resend HTTP API (Puerto 443 HTTPS - No bloqueado por Render) ---
        if (resendKey) {
            try {
                const fromEmail = process.env.RESEND_FROM || 'CzBarber <onboarding@resend.dev>';
                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: fromEmail,
                        to: [destEmail],
                        subject: subject,
                        html: html
                    })
                });

                const data = await res.json().catch(() => ({}));
                if (res.ok) {
                    console.log(`📧 [Resend HTTPS] Correo enviado exitosamente a ${destEmail}. ID: ${data.id}`);
                    return { success: true, messageId: data.id, accepted: [destEmail], rejected: [], error: null };
                } else {
                    lastError = `Resend: ${data.message || JSON.stringify(data)}`;
                    console.error(`❌ [Resend HTTPS] Error al enviar a ${destEmail}:`, lastError);
                }
            } catch (err) {
                lastError = `Resend: ${err.message}`;
                console.error(`❌ [Resend HTTPS] Excepción:`, err.message);
            }
        }

        // --- OPCIÓN 2: Brevo (Sendinblue) HTTP API (Puerto 443 HTTPS - No bloqueado por Render) ---
        if (brevoKey) {
            try {
                const res = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: {
                        'api-key': brevoKey,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        sender: { name: 'CzBarber', email: senderEmail },
                        to: [{ email: destEmail, name: recipientName }],
                        subject: subject,
                        htmlContent: html
                    })
                });

                const data = await res.json().catch(() => ({}));
                if (res.ok) {
                    console.log(`📧 [Brevo HTTPS] Correo enviado exitosamente a ${destEmail}. MessageId: ${data.messageId}`);
                    return { success: true, messageId: data.messageId, accepted: [destEmail], rejected: [], error: null };
                } else {
                    lastError = `Brevo: ${data.message || res.statusText}`;
                    console.error(`❌ [Brevo HTTPS] Error al enviar a ${destEmail}:`, lastError);
                }
            } catch (err) {
                lastError = `Brevo: ${err.message}`;
                console.error(`❌ [Brevo HTTPS] Excepción:`, err.message);
            }
        }

        // Si se configuró un proveedor HTTP pero falló y no hay SMTP configurado
        if (lastError && (!process.env.EMAIL_PASS || !process.env.EMAIL_USER)) {
            return { success: false, error: lastError, accepted: [], rejected: [destEmail] };
        }

        // --- OPCIÓN 3: SendGrid HTTP API (Puerto 443 HTTPS) ---
        if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.trim()) {
            try {
                const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY.trim()}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        personalizations: [{ to: [{ email: destEmail, name: recipientName }] }],
                        from: { email: senderEmail, name: 'CzBarber' },
                        subject: subject,
                        content: [{ type: 'text/html', value: html }]
                    })
                });

                if (res.ok || res.status === 202) {
                    const messageId = res.headers.get('x-message-id') || 'sendgrid-ok';
                    console.log(`📧 [SendGrid HTTPS] Correo enviado exitosamente a ${destEmail}. ID: ${messageId}`);
                    return { success: true, messageId, accepted: [destEmail], rejected: [], error: null };
                } else {
                    const data = await res.json().catch(() => ({}));
                    const errMsg = data.errors?.[0]?.message || `Error SendGrid status ${res.status}`;
                    console.error(`❌ [SendGrid HTTPS] Error:`, errMsg);
                    return { success: false, error: errMsg, accepted: [], rejected: [destEmail] };
                }
            } catch (err) {
                console.error(`❌ [SendGrid HTTPS] Excepción:`, err.message);
                return { success: false, error: `Excepción API SendGrid: ${err.message}`, accepted: [], rejected: [destEmail] };
            }
        }

        // --- OPCIÓN 4: SMTP Tradicional (Nodemailer) ---
        const user = (process.env.EMAIL_USER || '').trim();
        const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

        if (!user || !pass) {
            const msg = 'EMAIL_USER o EMAIL_PASS no están configurados en el backend.';
            console.warn(`⚠️ Advertencia: ${msg}`);
            return { success: false, error: msg, accepted: [], rejected: [destEmail] };
        }

        const mailOptions = {
            from: fromHeader,
            to: destEmail,
            subject: subject,
            html: html
        };

        try {
            const transporter = getTransporter();
            const info = await transporter.sendMail(mailOptions);
            console.log(`📧 [SMTP] Correo enviado exitosamente a ${destEmail}. ID: ${info?.messageId} - Respuesta: ${info?.response}`);
            return {
                success: true,
                messageId: info?.messageId,
                accepted: info?.accepted || [destEmail],
                rejected: info?.rejected || [],
                response: info?.response,
                error: null
            };
        } catch (error) {
            let errorMsg = error.message;
            if (errorMsg.includes('Connection timeout') || errorMsg.includes('ETIMEDOUT') || errorMsg.includes('ECONNREFUSED')) {
                errorMsg = `Connection timeout: Render Free Tier bloquea los puertos SMTP 25, 465 y 587. Configura BREVO_API_KEY o RESEND_API_KEY en Render para enviar vía HTTPS (puerto 443).`;
            }
            console.error(`❌ [SMTP] Error al enviar correo a ${destEmail}:`, errorMsg);
            return {
                success: false,
                messageId: null,
                accepted: [],
                rejected: [destEmail],
                error: errorMsg
            };
        }
    }

    /**
     * Verifica la conectividad con el servicio de correo.
     */
    static async verifyConnection() {
        const rawBrevo = (process.env.BREVO_API_KEY || '').trim();
        const rawResend = (process.env.RESEND_API_KEY || '').trim();
        const rawGeneric = (process.env.EMAIL_API_KEY || '').trim();

        const resendKey = rawResend || (rawBrevo.startsWith('re_') ? rawBrevo : null) || (rawGeneric.startsWith('re_') ? rawGeneric : null);
        const brevoKey = (rawBrevo && !rawBrevo.startsWith('re_')) ? rawBrevo : (rawResend.startsWith('xkeysib-') ? rawResend : null) || (rawGeneric.startsWith('xkeysib-') ? rawGeneric : null);

        if (resendKey) {
            return { success: true, message: 'Proveedor HTTP Resend configurado para envíos por puerto 443.' };
        }
        if (brevoKey) {
            return { success: true, message: 'Proveedor HTTP Brevo configurado para envíos por puerto 443.' };
        }
        if (process.env.SENDGRID_API_KEY) {
            return { success: true, message: 'Proveedor HTTP SendGrid configurado para envíos por puerto 443.' };
        }

        const user = (process.env.EMAIL_USER || '').trim();
        const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

        if (!user || !pass) {
            return { success: false, message: 'No hay credenciales EMAIL_USER/EMAIL_PASS ni API Key HTTP configurada.' };
        }

        try {
            const transporter = getTransporter();
            await transporter.verify();
            return { success: true, message: `Servidor SMTP listo desde ${user}.` };
        } catch (error) {
            return { success: false, message: `Fallo verificación SMTP: ${error.message}` };
        }
    }

    /**
     * Envía un correo de confirmación de cita al cliente inmediatamente tras el agendamiento.
     */
    static async sendConfirmationEmail({ email, clientName, serviceName, barberName, fecha, hora }) {
        const html = `
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
        `;

        return this.dispatchMail({
            to: email,
            subject: '💈 Confirmación de tu Cita - CzBarber',
            html,
            recipientName: clientName
        });
    }

    /**
     * Envía un correo de notificación al barbero asignado.
     */
    static async sendBarberConfirmationEmail({ email, clientName, serviceName, barberName, fecha, hora }) {
        const html = `
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
        `;

        return this.dispatchMail({
            to: email,
            subject: '💈 Nueva Cita Asignada - CzBarber',
            html,
            recipientName: barberName
        });
    }

    /**
     * Envía un correo de recordatorio (día antes) al cliente.
     */
    static async sendReminderEmail({ email, clientName, serviceName, barberName, fecha, hora }) {
        const html = `
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
        `;

        return this.dispatchMail({
            to: email,
            subject: '💈 Recordatorio de tu Cita - CzBarber',
            html,
            recipientName: clientName
        });
    }

    /**
     * Envía un correo de recordatorio (30 minutos antes) al cliente.
     */
    static async sendCustomer30MinReminderEmail({ email, clientName, serviceName, barberName, fecha, hora }) {
        const html = `
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
        `;

        return this.dispatchMail({
            to: email,
            subject: '⏰ Tu cita comienza en 30 minutos - CzBarber',
            html,
            recipientName: clientName
        });
    }

    /**
     * Envía un correo de recordatorio (30 minutos antes) al barbero.
     */
    static async sendBarberReminderEmail({ email, clientName, serviceName, barberName, fecha, hora }) {
        const html = `
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
        `;

        return this.dispatchMail({
            to: email,
            subject: '⏰ Cita en 30 minutos - CzBarber',
            html,
            recipientName: barberName
        });
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
