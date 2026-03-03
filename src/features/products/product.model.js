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

//     static async create(data) {
//         const pool = await poolPromise;
//         const { id_categoria, id_marca, nombre, precio, descripcion, stock, fecha_vencimiento, img } = data;
//         const result = await pool.request()
//             .input('id_cat', sql.Int, id_categoria)
//             .input('id_mar', sql.Int, id_marca)
//             .input('nom', sql.VarChar, nombre)
//             .input('pre', sql.Decimal(12,2), precio)
//             .input('des', sql.VarChar, descripcion)
//             .input('stk', sql.Int, stock)
//             .input('fec', sql.Date, fecha_vencimiento)
//             .input('img', sql.VarChar, img)
//             .query(`
//                 DECLARE @newId INT = (SELECT ISNULL(MAX(id_producto), 0) + 1 FROM Productos);
//                 INSERT INTO Productos (id_producto, id_categoria, id_marca, nombre, precio, descripcion, stock, fecha_vencimiento, img)
//                 VALUES (@newId, @id_cat, @id_mar, @nom, @pre, @des, @stk, @fec, @img);
//                 SELECT @newId as id;
//             `);
//         return result.recordset[0].id;
//     }
// }
// module.exports = ProductModel;

const { sql, poolPromise } = require('../../config/db');

class ProductModel {
    static async getAll() {
        const pool = await poolPromise;
        // LEFT JOIN para traer el nombre de la categoría y marca si existen
        const result = await pool.request().query(`
            SELECT p.*, c.nombre as categoria_nombre, m.nombre as marca_nombre 
            FROM Productos p
            LEFT JOIN Categorias_Productos c ON p.id_categoria = c.id_categoria
            LEFT JOIN Marcas m ON p.id_marca = m.id_marca
        `);
        return result.recordset;
    }

    static async getById(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Productos WHERE id_producto = @id');
        return result.recordset[0];
    }

    static async create(data) {
        const pool = await poolPromise;
        const { id_categoria, id_marca, nombre, precio, descripcion, stock, fecha_vencimiento, img } = data;

        const result = await pool.request()
            .input('id_cat', sql.Int, id_categoria || null)
            .input('id_mar', sql.Int, id_marca || null)
            .input('nom', sql.VarChar, nombre)
            .input('pre', sql.Decimal(12,2), precio)
            .input('des', sql.VarChar, descripcion || null)
            .input('stk', sql.Int, stock || 0)
            .input('fec', sql.Date, fecha_vencimiento || null)
            .input('img', sql.VarChar, img || null)
            .query(`
                DECLARE @newId INT;
                SELECT @newId = ISNULL(MAX(id_producto), 0) + 1 FROM Productos;

                INSERT INTO Productos (id_producto, id_categoria, id_marca, nombre, precio, descripcion, stock, fecha_vencimiento, img)
                VALUES (@newId, @id_cat, @id_mar, @nom, @pre, @des, @stk, @fec, @img);

                SELECT @newId AS insertId;
            `);
        return result.recordset[0].insertId;
    }

    static async update(id, data) {
        const pool = await poolPromise;
        const { id_categoria, id_marca, nombre, precio, descripcion, stock, fecha_vencimiento, img } = data;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('id_cat', sql.Int, id_categoria || null)
            .input('id_mar', sql.Int, id_marca || null)
            .input('nom', sql.VarChar, nombre)
            .input('pre', sql.Decimal(12,2), precio)
            .input('des', sql.VarChar, descripcion || null)
            .input('stk', sql.Int, stock || 0)
            .input('fec', sql.Date, fecha_vencimiento || null)
            .input('img', sql.VarChar, img || null)
            .query(`
                UPDATE Productos 
                SET id_categoria = @id_cat, id_marca = @id_mar, nombre = @nom, 
                    precio = @pre, descripcion = @des, stock = @stk, 
                    fecha_vencimiento = @fec, img = @img
                WHERE id_producto = @id
            `);
        return result.rowsAffected[0] > 0;
    }

    static async delete(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Productos WHERE id_producto = @id');
        return result.rowsAffected[0] > 0;
    }
}
module.exports = ProductModel;