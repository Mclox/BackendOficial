const db = require('../../config/db');

class ProductModel {
    static async getAll() {
        const result = await db.query(`
            SELECT p.*, c.nombre as categoria_nombre, m.nombre as marca_nombre 
            FROM Productos p
            LEFT JOIN Categorias_Productos c ON p.id_categoria = c.id_categoria
            LEFT JOIN Marcas m ON p.id_marca = m.id_marca
            ORDER BY p.id_producto ASC
        `);
        return result.rows;
    }

    static async getById(id) {
        const result = await db.query('SELECT * FROM Productos WHERE id_producto = $1', [id]);
        return result.rows[0];
    }

    static async create(data) {
        const { id_categoria, id_marca, nombre, precio_neto, iva_porcentaje, stock, codigo, descripcion, img, tipo_adquisicion } = data;

        const query = `
            INSERT INTO Productos (id_categoria, id_marca, nombre, precio_neto, iva_porcentaje, stock, codigo, descripcion, img, estado, tipo_adquisicion)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Activo', $10)
            RETURNING id_producto
        `;
        
        const values = [
            id_categoria || null,
            id_marca || null,
            nombre,
            precio_neto,
            iva_porcentaje !== undefined ? iva_porcentaje : 19.00,
            stock || 0,
            codigo || null,
            descripcion || null,
            img || null,
            tipo_adquisicion || 'compra_directa'
        ];

        const result = await db.query(query, values);
        return result.rows[0].id_producto;
    }

    static async update(id, data) {
        const { id_categoria, id_marca, nombre, precio_neto, iva_porcentaje, stock, codigo, descripcion, img, estado, tipo_adquisicion } = data;

        const query = `
            UPDATE Productos 
            SET id_categoria = $1, id_marca = $2, nombre = $3, 
                precio_neto = $4, iva_porcentaje = $5, stock = $6,
                codigo = $7, descripcion = $8, img = $9, estado = $10, tipo_adquisicion = $11
            WHERE id_producto = $12
        `;
        
        const values = [
            id_categoria || null,
            id_marca || null,
            nombre,
            precio_neto,
            iva_porcentaje !== undefined ? iva_porcentaje : 19.00,
            stock || 0,
            codigo || null,
            descripcion || null,
            img || null,
            estado || 'Activo',
            tipo_adquisicion || 'compra_directa',
            id
        ];

        const result = await db.query(query, values);
        return result.rowCount > 0;
    }

    static async delete(id) {
        const result = await db.query('DELETE FROM Productos WHERE id_producto = $1', [id]);
        return result.rowCount > 0;
    }
}

module.exports = ProductModel;