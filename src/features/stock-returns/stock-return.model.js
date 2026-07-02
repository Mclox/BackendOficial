const { sql, poolPromise } = require('../../config/db');

class StockReturnModel {
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT d.*, 
                   p.nombre as producto_nombre, 
                   u.nombre as usuario_nombre
            FROM Devoluciones_Stock d
            INNER JOIN Productos p ON d.id_producto = p.id_producto
            INNER JOIN Usuarios u ON d.id_usuario = u.id_usuario
            ORDER BY d.fecha DESC
        `);
        return result.recordset;
    }

    static async getById(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT * FROM Devoluciones_Stock
                WHERE id_devolucion = @id
            `);
        return result.recordset[0];
    }

    static async create(data) {
        const pool = await poolPromise;
        await pool.request()
            .input('id_venta', sql.Int, data.id_venta)
            .input('id_producto', sql.Int, data.id_producto)
            .input('id_usuario', sql.Int, data.id_usuario)
            .input('cantidad', sql.Int, data.cantidad)
            .input('motivo', sql.VarChar(500), data.motivo)
            .input('estado', sql.VarChar, data.estado || 'Pendiente')
            .query(`
                INSERT INTO Devoluciones_Stock (id_venta, id_producto, id_usuario, cantidad, motivo, estado)
                VALUES (@id_venta, @id_producto, @id_usuario, @cantidad, @motivo, @estado)
            `);
     }

     static async updateStatus(id, estado, id_usuario, motivoDetalle) {
         const pool = await poolPromise;
         
         // 1. Obtener la devolución actual para saber estado_anterior, id_producto y cantidad
         const dev = await this.getById(id);
         if (!dev) return false;

         const estadoAnterior = dev.estado || 'Pendiente';

         // Evitar reprocesar si ya está en el estado destino
         if (estadoAnterior.toLowerCase() === estado.toLowerCase()) {
             return true;
         }

         // 2. Si pasa a "Aprobada", reintegrar al stock
         // Solo reintegrar si no estaba ya Aprobada
         if (estado.toLowerCase() === 'aprobada' && estadoAnterior.toLowerCase() !== 'aprobada') {
             await pool.request()
                 .input('id_producto', sql.Int, dev.id_producto)
                 .input('cantidad', sql.Int, dev.cantidad)
                 .query(`
                     UPDATE Productos
                     SET stock = stock + @cantidad
                     WHERE id_producto = @id_producto
                 `);
         }

         // 3. Definir columnas a actualizar según el estado
         let queryUpdate = `
             UPDATE Devoluciones_Stock
             SET estado = @estado
         `;
         
         const request = pool.request()
             .input('id', sql.Int, id)
             .input('estado', sql.VarChar, estado);

         if (estado.toLowerCase() === 'rechazada') {
             queryUpdate += `, motivo_rechazo = @motivo_detalle`;
             request.input('motivo_detalle', sql.VarChar(500), motivoDetalle || null);
         } else if (estado.toLowerCase() === 'anulada') {
             queryUpdate += `, motivo_anulacion = @motivo_detalle`;
             request.input('motivo_detalle', sql.VarChar(500), motivoDetalle || null);
         }

         queryUpdate += ` WHERE id_devolucion = @id`;
         await request.query(queryUpdate);

         // 4. Registrar en la tabla de Auditoria
         let accion = 'Cambio de Estado';
         if (estado.toLowerCase() === 'aprobada') accion = 'Aprobar';
         else if (estado.toLowerCase() === 'rechazada') accion = 'Rechazar';
         else if (estado.toLowerCase() === 'anulada') accion = 'Anular';

         await pool.request()
             .input('tabla_afectada', sql.VarChar, 'Devoluciones_Stock')
             .input('id_registro', sql.Int, id)
             .input('accion', sql.VarChar, accion)
             .input('estado_anterior', sql.VarChar, estadoAnterior)
             .input('estado_nuevo', sql.VarChar, estado)
             .input('motivo', sql.VarChar(500), motivoDetalle || dev.motivo || null)
             .input('id_usuario', sql.Int, id_usuario)
             .query(`
                 INSERT INTO Auditoria (tabla_afectada, id_registro, accion, estado_anterior, estado_nuevo, motivo, id_usuario)
                 VALUES (@tabla_afectada, @id_registro, @accion, @estado_anterior, @estado_nuevo, @motivo, @id_usuario)
             `);

         return true;
     }
}
module.exports = StockReturnModel;