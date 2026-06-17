const nodemailer = require('nodemailer');

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
}

module.exports = MailService;
