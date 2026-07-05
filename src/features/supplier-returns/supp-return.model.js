const db = require('../../config/db');

class SuppReturnModel {
    static async getAll() {
        const result = await db.query(`
            SELECT d.*, p.nombre as proveedor_nombre 
            FROM Devoluciones_Proveedor d
            LEFT JOIN Proveedores p ON d.id_proveedor = p.id_proveedor
            ORDER BY d.fecha DESC
        `);
        return result.rows;
    }

    static async create(data) {
        const { id_detalle_compra, id_proveedor, motivo, cantidad_devuelta } = data;

        const query = `
            INSERT INTO Devoluciones_Proveedor (id_detalle_compra, id_proveedor, motivo, cantidad_devuelta, estado)
            VALUES ($1, $2, $3, $4, 'pendiente')
            RETURNING id_dev_prov
        `;
        const result = await db.query(query, [
            id_detalle_compra,
            id_proveedor,
            motivo || null,
            cantidad_devuelta
        ]);
        return result.rows[0].id_dev_prov;
    }
}

module.exports = SuppReturnModel;