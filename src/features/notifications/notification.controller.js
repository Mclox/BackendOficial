// const { sql, poolPromise } = require('../../config/db');
// const NotificationService = require('./notification.service');

// class NotificationController {
//     static async getRecent(req, res) {
//         try {
//             const pool = await poolPromise;
//             // Fetch latest 10 notifications
//             const result = await pool.request().query(`
//                 SELECT TOP 10 * 
//                 FROM Notificaciones 
//                 ORDER BY fecha_creacion DESC
//             `);
            
//             // Count unread
//             const unreadCountRes = await pool.request().query(`
//                 SELECT COUNT(*) as count 
//                 FROM Notificaciones 
//                 WHERE leido = 0
//             `);
            
//             res.json({ 
//                 success: true, 
//                 data: result.recordset,
//                 unreadCount: unreadCountRes.recordset[0].count 
//             });
//         } catch (error) {
//             res.status(500).json({ success: false, message: 'Error al obtener notificaciones recientes', error: error.message });
//         }
//     }

//     static async getAll(req, res) {
//         try {
//             const pool = await poolPromise;
//             const page = parseInt(req.query.page) || 1;
//             const limit = parseInt(req.query.limit) || 10;
//             const offset = (page - 1) * limit;

//             // Get total count
//             const totalCountRes = await pool.request().query('SELECT COUNT(*) as count FROM Notificaciones');
//             const total = totalCountRes.recordset[0].count;

//             // Get paginated notifications
//             const result = await pool.request()
//                 .input('limit', sql.Int, limit)
//                 .input('offset', sql.Int, offset)
//                 .query(`
//                     SELECT * 
//                     FROM Notificaciones 
//                     ORDER BY fecha_creacion DESC
//                     OFFSET @offset ROWS
//                     FETCH NEXT @limit ROWS ONLY
//                 `);

//             res.json({
//                 success: true,
//                 data: result.recordset,
//                 pagination: {
//                     total,
//                     page,
//                     limit,
//                     totalPages: Math.ceil(total / limit)
//                 }
//             });
//         } catch (error) {
//             res.status(500).json({ success: false, message: 'Error al obtener todas las notificaciones', error: error.message });
//         }
//     }

//     static async markAsRead(req, res) {
//         try {
//             const pool = await poolPromise;
//             const { id } = req.params;
            
//             await pool.request()
//                 .input('id', sql.Int, id)
//                 .query('UPDATE Notificaciones SET leido = 1 WHERE id = @id');

//             res.json({ success: true, message: 'Notificación marcada como leída' });
//         } catch (error) {
//             res.status(500).json({ success: false, message: 'Error al marcar notificación como leída', error: error.message });
//         }
//     }

//     static async markAllAsRead(req, res) {
//         try {
//             const pool = await poolPromise;
//             await pool.request().query('UPDATE Notificaciones SET leido = 1 WHERE leido = 0');
//             res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
//         } catch (error) {
//             res.status(500).json({ success: false, message: 'Error al marcar todas las notificaciones como leídas', error: error.message });
//         }
//     }

//     static sseStream(req, res) {
//         NotificationService.addSseClient(req, res);
//     }
// }

// module.exports = NotificationController;

const db = require('../../config/db');
const NotificationService = require('./notification.service');

class NotificationController {
    static async getRecent(req, res) {
        try {
            // Obtener las últimas 10 notificaciones
            const result = await db.query('SELECT * FROM Notificaciones ORDER BY fecha_creacion DESC LIMIT 10');
            
            // Contar no leídas
            const unreadRes = await db.query('SELECT COUNT(*) as count FROM Notificaciones WHERE leido = FALSE');
            
            res.json({ 
                success: true, 
                data: result.rows,
                unreadCount: parseInt(unreadRes.rows[0].count)
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            const totalRes = await db.query('SELECT COUNT(*) as count FROM Notificaciones');
            const total = parseInt(totalRes.rows[0].count);

            const result = await db.query(
                'SELECT * FROM Notificaciones ORDER BY fecha_creacion DESC LIMIT $1 OFFSET $2',
                [limit, offset]
            );

            res.json({
                success: true,
                data: result.rows,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async markAsRead(req, res) {
        try {
            await db.query('UPDATE Notificaciones SET leido = TRUE WHERE id = $1', [req.params.id]);
            res.json({ success: true, message: 'Notificación marcada como leída' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async markAllAsRead(req, res) {
        try {
            await db.query('UPDATE Notificaciones SET leido = TRUE WHERE leido = FALSE');
            res.json({ success: true, message: 'Todas marcadas como leídas' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static sseStream(req, res) {
        NotificationService.addSseClient(req, res);
    }
}

module.exports = NotificationController;