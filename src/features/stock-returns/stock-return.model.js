const db = require('../../config/db');

class StockReturnModel {
    static async getAll() {
        const result = await db.query(`
            SELECT d.*, 
                   p.nombre as producto_nombre, 
                   u.nombre as usuario_nombre
            FROM Devoluciones_Stock d
            INNER JOIN Productos p ON d.id_producto = p.id_producto
            INNER JOIN Usuarios u ON d.id_usuario = u.id_usuario
            ORDER BY d.fecha DESC
        `);
        return result.rows;
    }

    static async create(data) {
        const query = `
            INSERT INTO Devoluciones_Stock (id_venta, id_producto, id_usuario, cantidad, motivo, estado)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await db.query(query, [
            data.id_venta,
            data.id_producto,
            data.id_usuario,
            data.cantidad,
            data.motivo,
            data.estado || 'Activo'
        ]);
    }

    static async updateStatus(id, estado) {
        const result = await db.query(`
            UPDATE Devoluciones_Stock
            SET estado = $1
            WHERE id_devolucion = $2
        `, [estado, id]);
        return result.rowCount > 0;
    }
}

module.exports = StockReturnModel;