const db = require('../../config/db');

class ProductEntryModel {
    static async getAll() {
        const result = await db.query(`
            SELECT 
                E.id_entrada, E.cantidad, E.fecha, E.observaciones, E.estado, 
                E.motivo_anulacion, E.fecha_anulacion, E.id_producto,
                P.nombre AS producto_nombre,
                U.nombre AS nombre_usuario
            FROM Entradas_Productos E
            INNER JOIN Productos P ON E.id_producto = P.id_producto
            INNER JOIN Usuarios U ON E.id_usuario = U.id_usuario
            ORDER BY E.fecha DESC
        `);
        return result.rows;
    }

    static async create(data) {
        const query = `
            INSERT INTO Entradas_Productos (id_producto, id_usuario, cantidad, observaciones)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const values = [data.id_producto, data.id_usuario, data.cantidad, data.observaciones || null];
        const result = await db.query(query, values);
        return result.rows[0];
    }
    
    static async annul(id_entrada, motivo_anulacion) {
        const query = `
            UPDATE Entradas_Productos
            SET estado = 'Anulado', 
                motivo_anulacion = $1, 
                fecha_anulacion = CURRENT_TIMESTAMP
            WHERE id_entrada = $2 AND estado = 'Activo'
            RETURNING *
        `;
        const result = await db.query(query, [motivo_anulacion, id_entrada]);
        return result.rows[0];
    }
}

module.exports = ProductEntryModel;