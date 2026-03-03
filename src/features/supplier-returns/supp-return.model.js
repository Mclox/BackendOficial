    const { sql, poolPromise } = require('../../config/db');

class SuppReturnModel {
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT d.*, p.nombre as proveedor_nombre 
            FROM Devoluciones_Proveedor d
            LEFT JOIN Proveedores p ON d.id_proveedor = p.id_proveedor
            ORDER BY d.fecha DESC
        `);
        return result.recordset;
    }

    static async create(data) {
        const pool = await poolPromise;
        const { id_detalle_compra, id_proveedor, motivo, cantidad_devuelta } = data;

        const result = await pool.request()
            .input('id_det', sql.Int, id_detalle_compra)
            .input('id_pro', sql.Int, id_proveedor)
            .input('mot', sql.VarChar, motivo || null)
            .input('can', sql.Int, cantidad_devuelta)
            .query(`
                DECLARE @newId INT = (SELECT ISNULL(MAX(id_dev_prov), 0) + 1 FROM Devoluciones_Proveedor);
                INSERT INTO Devoluciones_Proveedor (id_dev_prov, id_detalle_compra, id_proveedor, fecha, motivo, cantidad_devuelta, estado)
                VALUES (@newId, @id_det, @id_pro, SYSUTCDATETIME(), @mot, @can, 'pendiente');
                SELECT @newId AS insertId;
            `);
        return result.recordset[0].insertId;
    }
}
module.exports = SuppReturnModel;