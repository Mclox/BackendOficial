const db = require('../../config/db');

class SaleModel {
    static async getAll() {
        const result = await db.query(`
            SELECT v.*, u_vend.nombre as vendedor_nombre 
            FROM Ventas v
            LEFT JOIN Usuarios u_vend ON v.id_vendedor = u_vend.id_usuario
            ORDER BY v.fecha DESC
        `);
        return result.rows;
    }

    static async createHeader(data) {
        const { id_cliente, id_vendedor, metodo_pago } = data;

        const query = `
            INSERT INTO Ventas (id_cliente, id_vendedor, metodo_pago)
            VALUES ($1, $2, $3)
            RETURNING id_venta
        `;
        const result = await db.query(query, [id_cliente || null, id_vendedor, metodo_pago]);
        return result.rows[0].id_venta;
    }

    static async createDetail(id_venta, data) {
        const { tipo, id_producto, id_servicio, id_barbero, cantidad, precio_unitario_neto, iva_porcentaje } = data;
        
        const iva_monto = (precio_unitario_neto * (iva_porcentaje || 0)) / 100;
        const subtotal_item = (precio_unitario_neto + iva_monto) * cantidad;

        const query = `
            INSERT INTO Ventas_Detalle (id_venta, tipo, id_producto, id_servicio, id_barbero, cantidad, precio_unitario_neto, iva_monto, subtotal_item)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        const values = [
            id_venta,
            tipo,
            id_producto || null,
            id_servicio || null,
            id_barbero || null,
            cantidad,
            precio_unitario_neto,
            iva_monto,
            subtotal_item
        ];
        await db.query(query, values);
    }

    static async getDetails(id_venta) {
        const result = await db.query(`
            SELECT d.*, 
                   p.nombre as producto_nombre, 
                   s.nombre as servicio_nombre
            FROM Ventas_Detalle d
            LEFT JOIN Productos p ON d.id_producto = p.id_producto
            LEFT JOIN Servicios s ON d.id_servicio = s.id_servicio
            WHERE d.id_venta = $1
        `, [id_venta]);
        return result.rows;
    }
}

module.exports = SaleModel;