// const { sql, poolPromise } = require('../../config/db');

// // Global list of SSE clients
// let sseClients = [];

// class NotificationService {
//     static async createNotification({ modulo, accion, descripcion, req }) {
//         try {
//             const pool = await poolPromise;
            
//             // Extract user info if request is available
//             const usuario_id = req && req.user ? req.user.id : null;
//             const usuario_nombre = req && req.user ? (req.user.email || req.user.rol) : 'Sistema';

//             const result = await pool.request()
//                 .input('modulo', sql.VarChar, modulo)
//                 .input('accion', sql.VarChar, accion)
//                 .input('descripcion', sql.NVarChar, descripcion)
//                 .input('usuario_id', sql.Int, usuario_id)
//                 .input('usuario_nombre', sql.VarChar, usuario_nombre)
//                 .query(`
//                     INSERT INTO Notificaciones (modulo, accion, descripcion, usuario_id, usuario_nombre, leido, fecha_creacion)
//                     OUTPUT inserted.id, inserted.modulo, inserted.accion, inserted.descripcion, inserted.usuario_id, inserted.usuario_nombre, inserted.leido, inserted.fecha_creacion
//                     VALUES (@modulo, @accion, @descripcion, @usuario_id, @usuario_nombre, 0, GETDATE())
//                 `);

//             const newNotif = result.recordset[0];
            
//             // Broadcast to SSE clients
//             this.broadcast(newNotif);

//             return newNotif;
//         } catch (error) {
//             console.error('Error creating notification:', error.message);
//         }
//     }

//     static addSseClient(req, res) {
//         res.setHeader('Content-Type', 'text/event-stream');
//         res.setHeader('Cache-Control', 'no-cache');
//         res.setHeader('Connection', 'keep-alive');
        
//         // Disable buffering for Nginx/compression if any
//         res.setHeader('X-Accel-Buffering', 'no');

//         // Send initial connection message
//         res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

//         const client = { id: Date.now(), res };
//         sseClients.push(client);

//         // Keep-alive ping every 30 seconds
//         const pingInterval = setInterval(() => {
//             try {
//                 res.write(': ping\n\n');
//             } catch (e) {
//                 // If write fails, the connection might be closed
//             }
//         }, 30000);

//         req.on('close', () => {
//             clearInterval(pingInterval);
//             sseClients = sseClients.filter(c => c.id !== client.id);
//         });
//     }

//     static broadcast(notification) {
//         const message = JSON.stringify({ type: 'notification', data: notification });
//         sseClients.forEach(client => {
//             try {
//                 client.res.write(`data: ${message}\n\n`);
//             } catch (e) {
//                 // Ignore write failures for individual disconnected clients
//             }
//         });
//     }
// }

// module.exports = NotificationService;


const db = require('../../config/db');

// Lista global de clientes para Server-Sent Events (SSE)
let sseClients = [];

class NotificationService {
    /**
     * Crea una notificación en la base de datos y la emite por SSE.
     */
    static async createNotification({ modulo, accion, descripcion, req }) {
        try {
            // Extraer información del usuario si existe en el objeto request (inyectado por el middleware de JWT)
            const usuario_id = req && req.user ? req.user.id : null;
            const usuario_nombre = req && req.user ? (req.user.email || req.user.rol) : 'Sistema';

            // Query con sintaxis nativa de PostgreSQL ($1, $2, etc.)
            const query = `
                INSERT INTO Notificaciones (modulo, accion, descripcion, usuario_id, usuario_nombre, leido, fecha_creacion)
                VALUES ($1, $2, $3, $4, $5, FALSE, CURRENT_TIMESTAMP)
                RETURNING *
            `;
            
            const values = [modulo, accion, descripcion, usuario_id, usuario_nombre];
            
            // Ejecución usando el pool de 'pg'
            const result = await db.query(query, values);

            const newNotif = result.rows[0];
            
            // Emitir la notificación en tiempo real a los clientes conectados
            this.broadcast(newNotif);

            return newNotif;
        } catch (error) {
            // Logueamos el error pero no bloqueamos la ejecución principal del programa
            console.error('❌ Error en NotificationService.createNotification:', error.message);
        }
    }

    /**
     * Maneja la conexión de clientes para notificaciones en tiempo real (SSE).
     */
    static addSseClient(req, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        // Envío de mensaje de conexión inicial exitosa
        const initialMessage = JSON.stringify({ type: 'connected', message: 'Ready for real-time notifications' });
        res.write(`data: ${initialMessage}\n\n`);

        const client = { id: Date.now(), res };
        sseClients.push(client);

        // Keep-alive: Enviamos un ping cada 30 segundos para evitar que la conexión se cierre por inactividad
        const pingInterval = setInterval(() => {
            try {
                res.write(': ping\n\n');
            } catch (e) {
                // Si falla la escritura, el cliente probablemente se desconectó
            }
        }, 30000);

        // Limpieza cuando el cliente cierra la pestaña o pierde conexión
        req.on('close', () => {
            clearInterval(pingInterval);
            sseClients = sseClients.filter(c => c.id !== client.id);
        });
    }

    /**
     * Envía la notificación a todos los navegadores conectados actualmente.
     */
    static broadcast(notification) {
        const message = JSON.stringify({ type: 'notification', data: notification });
        sseClients.forEach(client => {
            try {
                client.res.write(`data: ${message}\n\n`);
            } catch (e) {
                // Ignorar errores de escritura en clientes desconectados
            }
        });
    }
}

module.exports = NotificationService;