const db = require('../../config/db');

class PurchaseModel {
    static async getAll() {
        const result = await db.query(`
            SELECT c.*, p.nombre as nombre_proveedor 
            FROM Compras c
            JOIN Proveedores p ON c.id_proveedor = p.id_proveedor
            ORDER BY c.fecha_compra DESC
        `);
        return result.rows;
    }

    static async getById(id) {
        const headerResult = await db.query('SELECT * FROM Compras WHERE id_compra = $1', [id]);
        if (headerResult.rows.length === 0) return null;
        const compra = headerResult.rows[0];

        const detailsResult = await db.query(`
            SELECT dc.*, p.nombre as nombre_producto 
            FROM Detalle_Compra dc
            JOIN Productos p ON dc.id_producto = p.id_producto
            WHERE dc.id_compra = $1
        `, [id]);
            
        compra.detalles = detailsResult.rows;
        return compra;
    }

    static async createHeader(data) {
        const { id_proveedor, total } = data;

        const query = `
            INSERT INTO Compras (id_proveedor, total)
            VALUES ($1, $2)
            RETURNING id_compra
        `;
        const result = await db.query(query, [id_proveedor, total]);
        return result.rows[0].id_compra;
    }
}

module.exports = PurchaseModel;