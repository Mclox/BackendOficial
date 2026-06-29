const { sql, poolPromise } = require('../../config/db');

// Global list of SSE clients
let sseClients = [];

class NotificationService {
    static async createNotification({ modulo, accion, descripcion, req }) {
        try {
            const pool = await poolPromise;
            
            // Extract user info if request is available
            const usuario_id = req && req.user ? req.user.id : null;
            const usuario_nombre = req && req.user ? (req.user.email || req.user.rol) : 'Sistema';

            const result = await pool.request()
                .input('modulo', sql.VarChar, modulo)
                .input('accion', sql.VarChar, accion)
                .input('descripcion', sql.NVarChar, descripcion)
                .input('usuario_id', sql.Int, usuario_id)
                .input('usuario_nombre', sql.VarChar, usuario_nombre)
                .query(`
                    INSERT INTO Notificaciones (modulo, accion, descripcion, usuario_id, usuario_nombre, leido, fecha_creacion)
                    OUTPUT inserted.id, inserted.modulo, inserted.accion, inserted.descripcion, inserted.usuario_id, inserted.usuario_nombre, inserted.leido, inserted.fecha_creacion
                    VALUES (@modulo, @accion, @descripcion, @usuario_id, @usuario_nombre, 0, GETDATE())
                `);

            const newNotif = result.recordset[0];
            
            // Broadcast to SSE clients
            this.broadcast(newNotif);

            return newNotif;
        } catch (error) {
            console.error('Error creating notification:', error.message);
        }
    }

    static addSseClient(req, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Disable buffering for Nginx/compression if any
        res.setHeader('X-Accel-Buffering', 'no');

        // Send initial connection message
        res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

        const client = { id: Date.now(), res };
        sseClients.push(client);

        // Keep-alive ping every 30 seconds
        const pingInterval = setInterval(() => {
            try {
                res.write(': ping\n\n');
            } catch (e) {
                // If write fails, the connection might be closed
            }
        }, 30000);

        req.on('close', () => {
            clearInterval(pingInterval);
            sseClients = sseClients.filter(c => c.id !== client.id);
        });
    }

    static broadcast(notification) {
        const message = JSON.stringify({ type: 'notification', data: notification });
        sseClients.forEach(client => {
            try {
                client.res.write(`data: ${message}\n\n`);
            } catch (e) {
                // Ignore write failures for individual disconnected clients
            }
        });
    }
}

module.exports = NotificationService;
