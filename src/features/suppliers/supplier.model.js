const { sql, poolPromise } = require('../../config/db');

class SupplierModel {
    static async getAll() {
        const pool = await poolPromise;
        // Hacemos un LEFT JOIN con Marcas para traer el nombre de la marca si la tiene
        const result = await pool.request().query(`
            SELECT p.*, m.nombre as nombre_marca 
            FROM Proveedores p
            LEFT JOIN Marcas m ON p.id_marca = m.id_marca
        `);
        return result.recordset;
    }

    static async getById(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Proveedores WHERE id_proveedor = @id');
        return result.recordset[0];
    }

    static async create(data) {
        const pool = await poolPromise;
        const { id_marca, nombre, Documento, representante, telefono, correo } = data;

        const result = await pool.request()
            .input('id_marca', sql.Int, id_marca || null)
            .input('nombre', sql.VarChar, nombre)
            .input('Documento', sql.VarChar, Documento)
            .input('representante', sql.VarChar, representante || null)
            .input('telefono', sql.VarChar, telefono || null)
            .input('correo', sql.VarChar, correo || null)
            .query(`
                DECLARE @newId INT;
                SELECT @newId = ISNULL(MAX(id_proveedor), 0) + 1 FROM Proveedores;
                
                INSERT INTO Proveedores (id_proveedor, id_marca, nombre, Documento, representante, telefono, correo, estado)
                VALUES (@newId, @id_marca, @nombre, @Documento, @representante, @telefono, @correo, 'Activo');
                
                SELECT @newId AS insertId;
            `);
        return result.recordset[0].insertId;
    }

    static async update(id, data) {
        const pool = await poolPromise;
        const { id_marca, nombre, Documento, representante, telefono, correo, estado } = data;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('id_marca', sql.Int, id_marca || null)
            .input('nombre', sql.VarChar, nombre)
            .input('Documento', sql.VarChar, Documento)
            .input('representante', sql.VarChar, representante || null)
            .input('telefono', sql.VarChar, telefono || null)
            .input('correo', sql.VarChar, correo || null)
            .input('estado', sql.VarChar, estado || 'Activo')
            .query(`
                UPDATE Proveedores 
                SET id_marca = @id_marca, nombre = @nombre, Documento = @Documento, 
                    representante = @representante, telefono = @telefono, correo = @correo, estado = @estado
                WHERE id_proveedor = @id
            `);
        return result.rowsAffected[0] > 0;
    }

    static async delete(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Proveedores WHERE id_proveedor = @id');
        return result.rowsAffected[0] > 0;
    }
}
module.exports = SupplierModel;