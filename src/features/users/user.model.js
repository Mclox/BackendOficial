const db = require('../../config/db');

class UserModel {
    static async getAll() {
        const query = `
            SELECT u.id_usuario, u.nombre, u.tipo_documento, u.documento, u.email, u.telefono, u.direccion, u.img, u.estado,
                   r.nombre as rol_nombre, r.id_rol
            FROM Usuarios u
            JOIN Roles r ON u.id_rol = r.id_rol
            ORDER BY u.id_usuario ASC
        `;
        const result = await db.query(query);
        return result.rows;
    }

    static async getById(id) {
        const result = await db.query('SELECT * FROM Usuarios WHERE id_usuario = $1', [id]);
        return result.rows[0];
    }

    static async create(userData) {
        const { id_rol, nombre, tipo_documento, documento, email, telefono, direccion, contrasena, img } = userData;
        const query = `
            INSERT INTO Usuarios (id_rol, nombre, tipo_documento, documento, email, telefono, direccion, contrasena, img)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id_usuario
        `;
        const values = [id_rol, nombre, tipo_documento, documento, email, telefono, direccion || null, contrasena, img || null];
        const result = await db.query(query, values);
        return result.rows[0].id_usuario;
    }

    static async update(id, userData) {
        const { id_rol, nombre, tipo_documento, documento, email, telefono, direccion, img, estado } = userData;
        const query = `
            UPDATE Usuarios SET id_rol = $1, nombre = $2, tipo_documento = $3, documento = $4, email = $5, telefono = $6, direccion = $7, img = $8, estado = $9
            WHERE id_usuario = $10
        `;
        const values = [id_rol, nombre, tipo_documento, documento, email, telefono, direccion, img, estado, id];
        const result = await db.query(query, values);
        return result.rowCount > 0;
    }

    static async delete(id) {
        const result = await db.query('DELETE FROM Usuarios WHERE id_usuario = $1', [id]);
        return result.rowCount > 0;
    }
}
module.exports = UserModel;