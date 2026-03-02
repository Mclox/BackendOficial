const { sql, poolPromise } = require('../../config/db');

class ProductModel {
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT p.*, c.nombre as categoria_nombre, m.nombre as marca_nombre 
            FROM Productos p
            LEFT JOIN Categorias_Productos c ON p.id_categoria = c.id_categoria
            LEFT JOIN Marcas m ON p.id_marca = m.id_marca
        `);
        return result.recordset;
    }

    static async create(data) {
        const pool = await poolPromise;
        const { id_categoria, id_marca, nombre, precio, descripcion, stock, fecha_vencimiento, img } = data;
        const result = await pool.request()
            .input('id_cat', sql.Int, id_categoria)
            .input('id_mar', sql.Int, id_marca)
            .input('nom', sql.VarChar, nombre)
            .input('pre', sql.Decimal(12,2), precio)
            .input('des', sql.VarChar, descripcion)
            .input('stk', sql.Int, stock)
            .input('fec', sql.Date, fecha_vencimiento)
            .input('img', sql.VarChar, img)
            .query(`
                DECLARE @newId INT = (SELECT ISNULL(MAX(id_producto), 0) + 1 FROM Productos);
                INSERT INTO Productos (id_producto, id_categoria, id_marca, nombre, precio, descripcion, stock, fecha_vencimiento, img)
                VALUES (@newId, @id_cat, @id_mar, @nom, @pre, @des, @stk, @fec, @img);
                SELECT @newId as id;
            `);
        return result.recordset[0].id;
    }
}
module.exports = ProductModel;