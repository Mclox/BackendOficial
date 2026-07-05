const db = require('../../config/db');

class SupplierModel {
    static async getAll() {
        const result = await db.query(`
            SELECT p.*, m.nombre as nombre_marca 
            FROM Proveedores p
            LEFT JOIN Marcas m ON p.id_marca = m.id_marca
            ORDER BY p.id_proveedor ASC
        `);
        return result.rows;
    }

    static async getById(id) {
        const result = await db.query('SELECT * FROM Proveedores WHERE id_proveedor = $1', [id]);
        return result.rows[0];
    }

    static async create(data) {
        const { id_marca, nombre, Documento, representante, telefono, correo } = data;

        const query = `
            INSERT INTO Proveedores (id_marca, nombre, documento, representante, telefono, correo, estado)
            VALUES ($1, $2, $3, $4, $5, $6, 'Activo')
            RETURNING id_proveedor
        `;
        
        const result = await db.query(query, [
            id_marca || null,
            nombre,
            Documento,
            representante || null,
            telefono || null,
            correo || null
        ]);
        return result.rows[0].id_proveedor;
    }

    static async update(id, data) {
        const { id_marca, nombre, Documento, representante, telefono, correo, estado } = data;

        const query = `
            UPDATE Proveedores 
            SET id_marca = $1, nombre = $2, documento = $3, 
                representante = $4, telefono = $5, correo = $6, estado = $7
            WHERE id_proveedor = $8
        `;
        const result = await db.query(query, [
            id_marca || null,
            nombre,
            Documento,
            representante || null,
            telefono || null,
            correo || null,
            estado || 'Activo',
            id
        ]);
        return result.rowCount > 0;
    }

    static async delete(id) {
        const result = await db.query('DELETE FROM Proveedores WHERE id_proveedor = $1', [id]);
        return result.rowCount > 0;
    }
}

module.exports = SupplierModel;