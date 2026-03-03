const { sql, poolPromise } = require('../../config/db');

class SaleModel {
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT v.*, c.nombre as cliente_nombre 
            FROM Ventas_Productos v
            LEFT JOIN Clientes c ON v.id_cliente = c.id_cliente
            ORDER BY v.fecha DESC
        `);
        return result.recordset;
    }

    static async create(data) {
        const pool = await poolPromise;
        const { id_cliente, total } = data;

        const result = await pool.request()
            .input('id_cli', sql.Int, id_cliente || null)
            .input('tot', sql.Decimal(12,2), total)
            .query(`
                DECLARE @newId INT = (SELECT ISNULL(MAX(id_venta_prod), 0) + 1 FROM Ventas_Productos);
                INSERT INTO Ventas_Productos (id_venta_prod, id_cliente, fecha, total, estado)
                VALUES (@newId, @id_cli, SYSUTCDATETIME(), @tot, 'Pagado');
                SELECT @newId AS insertId;
            `);
        return result.recordset[0].insertId;
    }
}
module.exports = SaleModel;