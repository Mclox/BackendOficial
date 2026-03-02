const { sql, poolPromise } = require('../../config/db');

class PurchaseModel {
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT c.*, p.nombre as nombre_proveedor 
            FROM Compras c
            JOIN Proveedores p ON c.id_proveedor = p.id_proveedor
            ORDER BY c.fecha_compra DESC
        `);
        return result.recordset;
    }

    static async getById(id) {
        const pool = await poolPromise;
        
        // Obtenemos la cabecera de la compra
        const headerResult = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Compras WHERE id_compra = @id');
            
        if(headerResult.recordset.length === 0) return null;
        const compra = headerResult.recordset[0];

        // Obtenemos los detalles (productos comprados)
        const detailsResult = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT dc.*, p.nombre as nombre_producto 
                FROM Detalle_Compra dc
                JOIN Productos p ON dc.id_producto = p.id_producto
                WHERE dc.id_compra = @id
            `);
            
        compra.detalles = detailsResult.recordset;
        return compra;
    }

    // Para efectos de mantenerlo simple y funcional en la entrega
    static async createHeader(data) {
        const pool = await poolPromise;
        const { id_proveedor, total } = data;

        const result = await pool.request()
            .input('id_proveedor', sql.Int, id_proveedor)
            .input('total', sql.Decimal(12,2), total)
            .query(`
                DECLARE @newId INT;
                SELECT @newId = ISNULL(MAX(id_compra), 0) + 1 FROM Compras;
                
                INSERT INTO Compras (id_compra, id_proveedor, fecha_compra, total)
                VALUES (@newId, @id_proveedor, SYSUTCDATETIME(), @total);
                
                SELECT @newId AS insertId;
            `);
        return result.recordset[0].insertId;
    }
}
module.exports = PurchaseModel;