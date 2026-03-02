const { sql, poolPromise } = require('../../config/db');

class StockReturnModel {
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Devoluciones ORDER BY fecha DESC');
        return result.recordset;
    }

    static async create(data) {
        const pool = await poolPromise;
        const { id_venta_prod_detalle, motivo, remitido } = data;

        const result = await pool.request()
            .input('id_venta_prod_detalle', sql.Int, id_venta_prod_detalle || null)
            .input('motivo', sql.VarChar, motivo || null)
            .input('remitido', sql.VarChar, remitido)
            .query(`
                DECLARE @newId INT;
                SELECT @newId = ISNULL(MAX(id_devolucion), 0) + 1 FROM Devoluciones;
                
                INSERT INTO Devoluciones (id_devolucion, id_venta_prod_detalle, motivo, fecha, remitido)
                VALUES (@newId, @id_venta_prod_detalle, @motivo, SYSUTCDATETIME(), @remitido);
                
                SELECT @newId AS insertId;
            `);
        return result.recordset[0].insertId;
    }
}
module.exports = StockReturnModel;