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

    static async create(data) {
        const pool = await poolPromise;
        await pool.request()
            .input('id_venta', sql.Int, data.id_venta)
            .input('id_producto', sql.Int, data.id_producto)
            .input('id_usuario', sql.Int, data.id_usuario)
            .input('cantidad', sql.Int, data.cantidad)
            .input('motivo', sql.VarChar(500), data.motivo)
            .input('estado', sql.VarChar, data.estado || 'Activo')
            .query(`
                INSERT INTO Devoluciones_Stock (id_venta, id_producto, id_usuario, cantidad, motivo, estado)
                VALUES (@id_venta, @id_producto, @id_usuario, @cantidad, @motivo, @estado)
            `);
     }

     static async updateStatus(id, estado) {
         const pool = await poolPromise;
         const result = await pool.request()
             .input('id', sql.Int, id)
             .input('estado', sql.VarChar, estado)
             .query(`
                 UPDATE Devoluciones_Stock
                 SET estado = @estado
                 WHERE id_devolucion = @id
             `);
         return result.rowsAffected[0] > 0;
     }
}
module.exports = StockReturnModel;