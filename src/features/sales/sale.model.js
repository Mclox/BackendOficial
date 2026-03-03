const { sql, poolPromise } = require('../../config/db');

class SaleModel {
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT v.*, u_vend.nombre as vendedor_nombre 
            FROM Ventas v
            LEFT JOIN Usuarios u_vend ON v.id_vendedor = u_vend.id_usuario
            ORDER BY v.fecha DESC
        `);
        return result.recordset;
    }

    static async createHeader(data) {
        const pool = await poolPromise;
        const { id_cliente, id_vendedor, metodo_pago } = data;

        const result = await pool.request()
            .input('id_cli', sql.Int, id_cliente || null)
            .input('id_ven', sql.Int, id_vendedor)
            .input('metodo', sql.VarChar, metodo_pago)
            .query(`
                DECLARE @newId INT = (SELECT ISNULL(MAX(id_venta), 0) + 1 FROM Ventas);
                INSERT INTO Ventas (id_venta, id_cliente, id_vendedor, metodo_pago)
                VALUES (@newId, @id_cli, @id_ven, @metodo);
                SELECT @newId AS insertId;
            `);
        return result.recordset[0].insertId;
    }

    static async createDetail(id_venta, data) {
        const pool = await poolPromise;
        const { tipo, id_producto, id_servicio, id_barbero, cantidad, precio_unitario_neto, iva_porcentaje } = data;
        
        // Calculamos el IVA y el Subtotal del ítem en Node para enviárselo a SQL
        const iva_monto = (precio_unitario_neto * (iva_porcentaje || 0)) / 100;
        const subtotal_item = (precio_unitario_neto + iva_monto) * cantidad;

        await pool.request()
            .input('id_v', sql.Int, id_venta)
            .input('tipo', sql.VarChar, tipo)
            .input('id_prod', sql.Int, id_producto || null)
            .input('id_serv', sql.Int, id_servicio || null)
            .input('id_barb', sql.Int, id_barbero || null)
            .input('cant', sql.Int, cantidad)
            .input('precio_neto', sql.Decimal(12,2), precio_unitario_neto)
            .input('iva_m', sql.Decimal(12,2), iva_monto)
            .input('subtot', sql.Decimal(12,2), subtotal_item)
            .query(`
                INSERT INTO Ventas_Detalle (id_venta, tipo, id_producto, id_servicio, id_barbero, cantidad, precio_unitario_neto, iva_monto, subtotal_item)
                VALUES (@id_v, @tipo, @id_prod, @id_serv, @id_barb, @cant, @precio_neto, @iva_m, @subtot)
            `);
        // No necesitamos retornar nada, el Trigger hace el resto
    }
}
module.exports = SaleModel;