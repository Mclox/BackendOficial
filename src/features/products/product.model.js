// const { sql, poolPromise } = require('../../config/db');

// class ProductModel {
//     static async getAll() {
//         const pool = await poolPromise;
//         const result = await pool.request().query(`
//             SELECT p.*, c.nombre as categoria_nombre, m.nombre as marca_nombre 
//             FROM Productos p
//             LEFT JOIN Categorias_Productos c ON p.id_categoria = c.id_categoria
//             LEFT JOIN Marcas m ON p.id_marca = m.id_marca
//         `);
//         return result.recordset;
//     }

//     static async getById(id) {
//         const pool = await poolPromise;
//         const result = await pool.request()
//             .input('id', sql.Int, id)
//             .query('SELECT * FROM Productos WHERE id_producto = @id');
//         return result.recordset[0];
//     }

//     static async create(data) {
//         const pool = await poolPromise;
//         // Agregamos todos los campos nuevos
//         const { id_categoria, id_marca, nombre, precio_neto, iva_porcentaje, stock, codigo, descripcion, img, tipo_adquisicion } = data;

//         const result = await pool.request()
//             .input('id_cat', sql.Int, id_categoria || null)
//             .input('id_mar', sql.Int, id_marca || null)
//             .input('nom', sql.VarChar, nombre)
//             .input('pre_neto', sql.Decimal(12,2), precio_neto)
//             .input('iva', sql.Decimal(5,2), iva_porcentaje || 19.00)
//             .input('stk', sql.Int, stock || 0)
//             .input('cod', sql.VarChar, codigo || null)
//             .input('des', sql.VarChar, descripcion || null)
//             .input('img', sql.VarChar, img || null)
//             .input('tipo', sql.VarChar, tipo_adquisicion || 'compra_directa')
//             .query(`
//                 DECLARE @newId INT = (SELECT ISNULL(MAX(id_producto), 0) + 1 FROM Productos);
                
//                 INSERT INTO Productos (id_producto, id_categoria, id_marca, nombre, precio_neto, iva_porcentaje, stock, codigo, descripcion, img, estado, tipo_adquisicion)
//                 VALUES (@newId, @id_cat, @id_mar, @nom, @pre_neto, @iva, @stk, @cod, @des, @img, 'Activo', @tipo);
                
//                 SELECT @newId AS insertId;
//             `);
//         return result.recordset[0].insertId;
//     }

//     static async update(id, data) {
//         const pool = await poolPromise;
//         const { id_categoria, id_marca, nombre, precio_neto, iva_porcentaje, stock, codigo, descripcion, img, estado, tipo_adquisicion } = data;

//         const result = await pool.request()
//             .input('id', sql.Int, id)
//             .input('id_cat', sql.Int, id_categoria || null)
//             .input('id_mar', sql.Int, id_marca || null)
//             .input('nom', sql.VarChar, nombre)
//             .input('pre_neto', sql.Decimal(12,2), precio_neto)
//             .input('iva', sql.Decimal(5,2), iva_porcentaje || 19.00)
//             .input('stk', sql.Int, stock || 0)
//             .input('cod', sql.VarChar, codigo || null)
//             .input('des', sql.VarChar, descripcion || null)
//             .input('img', sql.VarChar, img || null)
//             .input('est', sql.VarChar, estado || 'Activo')
//             .input('tipo', sql.VarChar, tipo_adquisicion || 'compra_directa')
//             .query(`
//                 UPDATE Productos 
//                 SET id_categoria = @id_cat, id_marca = @id_mar, nombre = @nom, 
//                     precio_neto = @pre_neto, iva_porcentaje = @iva, stock = @stk,
//                     codigo = @cod, descripcion = @des, img = @img, estado = @est, tipo_adquisicion = @tipo
//                 WHERE id_producto = @id
//             `);
//         return result.rowsAffected[0] > 0;
//     }

//     static async delete(id) {
//         const pool = await poolPromise;
//         const result = await pool.request()
//             .input('id', sql.Int, id)
//             .query('DELETE FROM Productos WHERE id_producto = @id');
//         return result.rowsAffected[0] > 0;
//     }
// }
// module.exports = ProductModel;

const { sql, getPool } = require('../../config/db');

class ProductModel {
    static async getAll() {
        const pool = await getPool();
        if (!pool) throw new Error('No se pudo obtener el pool de conexiones.');

        const result = await pool.request().query(`
            SELECT p.*, c.nombre as categoria_nombre, m.nombre as marca_nombre 
            FROM Productos p
            LEFT JOIN Categorias_Productos c ON p.id_categoria = c.id_categoria
            LEFT JOIN Marcas m ON p.id_marca = m.id_marca
        `);
        return result.recordset;
    }

    static async getById(id) {
        const pool = await getPool();
        if (!pool) throw new Error('No se pudo obtener el pool de conexiones.');

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Productos WHERE id_producto = @id');
        return result.recordset[0];
    }

    static async create(data) {
        const pool = await getPool();
        if (!pool) throw new Error('No se pudo obtener el pool de conexiones.');

        // Agregamos todos los campos nuevos
        const { id_categoria, id_marca, nombre, precio_neto, iva_porcentaje, stock, codigo, descripcion, img, tipo_adquisicion } = data;

        const result = await pool.request()
            .input('id_cat', sql.Int, id_categoria || null)
            .input('id_mar', sql.Int, id_marca || null)
            .input('nom', sql.VarChar, nombre)
            .input('pre_neto', sql.Decimal(12,2), precio_neto)
            .input('iva', sql.Decimal(5,2), iva_porcentaje || 19.00)
            .input('stk', sql.Int, stock || 0)
            .input('cod', sql.VarChar, codigo || null)
            .input('des', sql.VarChar, descripcion || null)
            .input('img', sql.VarChar, img || null)
            .input('tipo', sql.VarChar, tipo_adquisicion || 'compra_directa')
            .query(`
                DECLARE @newId INT = (SELECT ISNULL(MAX(id_producto), 0) + 1 FROM Productos);
                
                INSERT INTO Productos (id_producto, id_categoria, id_marca, nombre, precio_neto, iva_porcentaje, stock, codigo, descripcion, img, estado, tipo_adquisicion)
                VALUES (@newId, @id_cat, @id_mar, @nom, @pre_neto, @iva, @stk, @cod, @des, @img, 'Activo', @tipo);
                
                SELECT @newId AS insertId;
            `);
        return result.recordset[0].insertId;
    }

    static async update(id, data) {
        const pool = await getPool();
        if (!pool) throw new Error('No se pudo obtener el pool de conexiones.');

        const { id_categoria, id_marca, nombre, precio_neto, iva_porcentaje, stock, codigo, descripcion, img, estado, tipo_adquisicion } = data;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('id_cat', sql.Int, id_categoria || null)
            .input('id_mar', sql.Int, id_marca || null)
            .input('nom', sql.VarChar, nombre)
            .input('pre_neto', sql.Decimal(12,2), precio_neto)
            .input('iva', sql.Decimal(5,2), iva_porcentaje || 19.00)
            .input('stk', sql.Int, stock || 0)
            .input('cod', sql.VarChar, codigo || null)
            .input('des', sql.VarChar, descripcion || null)
            .input('img', sql.VarChar, img || null)
            .input('est', sql.VarChar, estado || 'Activo')
            .input('tipo', sql.VarChar, tipo_adquisicion || 'compra_directa')
            .query(`
                UPDATE Productos 
                SET id_categoria = @id_cat, id_marca = @id_mar, nombre = @nom, 
                    precio_neto = @pre_neto, iva_porcentaje = @iva, stock = @stk,
                    codigo = @cod, descripcion = @des, img = @img, estado = @est, tipo_adquisicion = @tipo
                WHERE id_producto = @id
            `);
        return result.rowsAffected[0] > 0;
    }

    static async delete(id) {
        const pool = await getPool();
        if (!pool) throw new Error('No se pudo obtener el pool de conexiones.');

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Productos WHERE id_producto = @id');
        return result.rowsAffected[0] > 0;
    }
}
module.exports = ProductModel;