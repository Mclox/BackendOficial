const { sql, poolPromise } = require('../../config/db');

class RoleModel {
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Roles');
        
        // Convertimos el string JSON de la BD a un objeto de JS para el Frontend
        return result.recordset.map(role => ({
            ...role,
            permisos: role.permisos ? JSON.parse(role.permisos) : []
        }));
    }

    static async getById(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Roles WHERE id_rol = @id');
            
        if (result.recordset[0]) {
            result.recordset[0].permisos = result.recordset[0].permisos ? JSON.parse(result.recordset[0].permisos) : [];
        }
        return result.recordset[0];
    }

    static async create(data) {
        const pool = await poolPromise;
        const { nombre, descripcion, estado, permisos } = data;

        // Convertimos el array de permisos que manda React a un String JSON para SQL Server
        const permisosString = permisos ? JSON.stringify(permisos) : '[]';

        const result = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('descripcion', sql.VarChar, descripcion || null)
            .input('estado', sql.VarChar, estado || 'Activo')
            .input('permisos', sql.NVarChar(sql.MAX), permisosString)
            .query(`
                DECLARE @newId INT = (SELECT ISNULL(MAX(id_rol), 0) + 1 FROM Roles);

                INSERT INTO Roles (id_rol, nombre, descripcion, estado, permisos)
                VALUES (@newId, @nombre, @descripcion, @estado, @permisos);

                SELECT @newId AS insertId;
            `);
        return result.recordset[0].insertId;
    }

    static async update(id, data) {
        const pool = await poolPromise;
        const { nombre, descripcion, estado, permisos } = data;
        
        const permisosString = permisos ? JSON.stringify(permisos) : '[]';

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.VarChar, nombre)
            .input('descripcion', sql.VarChar, descripcion || null)
            .input('estado', sql.VarChar, estado || 'Activo')
            .input('permisos', sql.NVarChar(sql.MAX), permisosString)
            .query(`
                UPDATE Roles 
                SET nombre = @nombre, descripcion = @descripcion, estado = @estado, permisos = @permisos
                WHERE id_rol = @id
            `);
        return result.rowsAffected[0] > 0;
    }

    static async delete(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Roles WHERE id_rol = @id');
        return result.rowsAffected[0] > 0;
    }
}
module.exports = RoleModel;