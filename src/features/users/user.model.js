const { sql, poolPromise } = require('../../config/db');

class UserModel {
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT u.id_usuario, u.nombre, u.documento, u.email, u.telefono, u.direccion, u.img, 
                   r.nombre as rol_nombre, r.id_rol
            FROM Usuarios u
            JOIN Roles r ON u.id_rol = r.id_rol
        `);
        return result.recordset;
    }

    static async getById(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Usuarios WHERE id_usuario = @id');
        return result.recordset[0];
    }

    static async create(userData) {
        const pool = await poolPromise;
        const { id_rol, nombre, documento, email, telefono, direccion, contrasena, img } = userData;

        const result = await pool.request()
            .input('id_rol', sql.Int, id_rol)
            .input('nombre', sql.VarChar, nombre)
            .input('documento', sql.VarChar, documento)
            .input('email', sql.VarChar, email)
            .input('telefono', sql.VarChar, telefono)
            .input('direccion', sql.VarChar, direccion)
            .input('contrasena', sql.VarChar, contrasena) 
            .input('img', sql.VarChar, img || null)
            .query(`
                DECLARE @newId INT;
                SELECT @newId = ISNULL(MAX(id_usuario), 0) + 1 FROM Usuarios;
                
                INSERT INTO Usuarios (id_usuario, id_rol, nombre, documento, email, telefono, direccion, contrasena, img)
                VALUES (@newId, @id_rol, @nombre, @documento, @email, @telefono, @direccion, @contrasena, @img);
                
                SELECT @newId AS insertId;
            `);
        return result.recordset[0].insertId;
    }

    static async update(id, userData) {
        const pool = await poolPromise;
        const { id_rol, nombre, documento, email, telefono, direccion, img } = userData;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('id_rol', sql.Int, id_rol)
            .input('nombre', sql.VarChar, nombre)
            .input('documento', sql.VarChar, documento)
            .input('email', sql.VarChar, email)
            .input('telefono', sql.VarChar, telefono)
            .input('direccion', sql.VarChar, direccion)
            .input('img', sql.VarChar, img || null)
            .query(`
                UPDATE Usuarios 
                SET id_rol = @id_rol, nombre = @nombre, documento = @documento, 
                    email = @email, telefono = @telefono, direccion = @direccion, img = @img
                WHERE id_usuario = @id
            `);
        return result.rowsAffected[0] > 0;
    }

    static async delete(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Usuarios WHERE id_usuario = @id');
        return result.rowsAffected[0] > 0;
    }
}
module.exports = UserModel;