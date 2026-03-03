const { sql, poolPromise } = require('../../config/db');

class RoleModel {
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Roles');
        return result.recordset;
    }

    static async getById(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Roles WHERE id_rol = @id');
        return result.recordset[0];
    }

    static async create(data) {
        const pool = await poolPromise;
        // Según tu BD, el id_rol no es autoincremental, así que calculamos el siguiente
        const { nombre, descripcion } = data; 

        const result = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('descripcion', sql.VarChar, descripcion || null)
            .query(`
                DECLARE @newId INT;
                SELECT @newId = ISNULL(MAX(id_rol), 0) + 1 FROM Roles;

                INSERT INTO Roles (id_rol, nombre, descripcion)
                VALUES (@newId, @nombre, @descripcion);

                SELECT @newId AS insertId;
            `);
        return result.recordset[0].insertId;
    }

    static async update(id, data) {
        const pool = await poolPromise;
        const { nombre, descripcion } = data;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.VarChar, nombre)
            .input('descripcion', sql.VarChar, descripcion || null)
            .query(`
                UPDATE Roles 
                SET nombre = @nombre, descripcion = @descripcion
                WHERE id_rol = @id
            `);
        return result.rowsAffected[0] > 0;
    }
}
module.exports = RoleModel;