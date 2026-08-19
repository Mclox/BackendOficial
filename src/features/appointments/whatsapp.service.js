const https = require('https');

class WhatsAppService {
    /**
     * Envía un mensaje de WhatsApp utilizando el proveedor configurado (Meta o Twilio).
     * Si no se configuran las credenciales en el archivo .env, el servicio
     * funciona en modo de simulación y escribe los mensajes en la consola.
     * 
     * @param {string} to Número de teléfono de destino (con código de país, ej: +573001234567)
     * @param {string} text Contenido del mensaje a enviar
     */
    static async sendMessage(to, text) {
        // En esta versión, el envío automático por API (Meta/Twilio) está deshabilitado temporalmente.
        // Se preserva toda la lógica para que al cambiar WHATSAPP_AUTO_SEND=true en .env vuelva a funcionar automáticamente.
        const autoSendEnabled = process.env.WHATSAPP_AUTO_SEND === 'true';
        if (!autoSendEnabled) {
            console.log(`📱 [WhatsApp Manual - API Deshabilitada] Destinatario: ${to}`);
            console.log(`💬 Mensaje preparado: "${text}"`);
            return { success: true, mode: 'manual' };
        }

        if (!to) {
            console.log("⚠️ [WhatsApp] No se proporcionó número de teléfono para enviar el mensaje.");
            return false;
        }

        // Limpiar y formatear el número de teléfono (dejar solo dígitos y el signo +)
        let cleanNumber = to.trim().replace(/[^\d+]/g, '');
        if (!cleanNumber.startsWith('+')) {
            cleanNumber = '+' + cleanNumber;
        }

        const provider = (process.env.WHATSAPP_PROVIDER || 'simulation').toLowerCase();

        if (provider === 'meta') {
            return this.sendViaMeta(cleanNumber, text);
        } else if (provider === 'twilio') {
            return this.sendViaTwilio(cleanNumber, text);
        } else {
            // Modo simulación por defecto si no está configurado un proveedor real
            console.log(`\n======================================================`);
            console.log(`📱 [Simulación WhatsApp] Para: ${cleanNumber}`);
            console.log(`💬 Mensaje:\n${text}`);
            console.log(`⚙️ Proveedor: SIMULACIÓN (Configure WHATSAPP_PROVIDER en .env)`);
            console.log(`======================================================\n`);
            return true;
        }
    }

    /**
     * Envia el mensaje usando la API oficial de Meta (WhatsApp Business Cloud API).
     */
    static async sendViaMeta(to, text) {
        const token = process.env.META_WHATSAPP_TOKEN;
        const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

        if (!token || !phoneNumberId) {
            console.warn("⚠️ [WhatsApp Meta] Falta configurar META_WHATSAPP_TOKEN o META_PHONE_NUMBER_ID en .env. Simulación activa.");
            return this.simulateFallback(to, text, 'Meta');
        }

        // Meta Cloud API espera el número sin el caracter '+'
        const recipientNumber = to.replace('+', '');

        const postData = JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: recipientNumber,
            type: "text",
            text: {
                body: text
            }
        });

        const options = {
            hostname: 'graph.facebook.com',
            port: 443,
            path: `/v18.0/${phoneNumberId}/messages`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        return new Promise((resolve) => {
            const req = https.request(options, (res) => {
                let responseBody = '';
                res.on('data', (chunk) => { responseBody += chunk; });
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log(`✅ [WhatsApp Meta] Mensaje enviado exitosamente a ${to}`);
                        resolve(true);
                    } else {
                        console.error(`❌ [WhatsApp Meta] Error de Meta API (Status ${res.statusCode}):`, responseBody);
                        resolve(false);
                    }
                });
            });

            req.on('error', (e) => {
                console.error(`❌ [WhatsApp Meta] Error de conexión al enviar mensaje a ${to}:`, e.message);
                resolve(false);
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Envia el mensaje usando la API de Twilio.
     */
    static async sendViaTwilio(to, text) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_FROM_NUMBER || 'whatsapp:+14155238886';

        if (!accountSid || !authToken) {
            console.warn("⚠️ [WhatsApp Twilio] Falta configurar TWILIO_ACCOUNT_SID o TWILIO_AUTH_TOKEN en .env. Simulación activa.");
            return this.simulateFallback(to, text, 'Twilio');
        }

        const formattedTo = `whatsapp:${to}`;

        const postData = new URLSearchParams({
            From: fromNumber,
            To: formattedTo,
            Body: text
        }).toString();

        const options = {
            hostname: 'api.twilio.com',
            port: 443,
            path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        return new Promise((resolve) => {
            const req = https.request(options, (res) => {
                let responseBody = '';
                res.on('data', (chunk) => { responseBody += chunk; });
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log(`✅ [WhatsApp Twilio] Mensaje enviado exitosamente a ${to}`);
                        resolve(true);
                    } else {
                        console.error(`❌ [WhatsApp Twilio] Error de Twilio API (Status ${res.statusCode}):`, responseBody);
                        resolve(false);
                    }
                });
            });

            req.on('error', (e) => {
                console.error(`❌ [WhatsApp Twilio] Error de conexión al enviar mensaje a ${to}:`, e.message);
                resolve(false);
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Fallback de simulación cuando falta configurar credenciales en producción.
     */
    static simulateFallback(to, text, providerName) {
        console.log(`\n======================================================`);
        console.log(`📱 [Simulación Fallback WhatsApp - ${providerName}] Para: ${to}`);
        console.log(`💬 Mensaje:\n${text}`);
        console.log(`⚠️ Alerta: Credenciales incompletas en .env`);
        console.log(`======================================================\n`);
        return true;
    }
}

module.exports = WhatsAppService;
