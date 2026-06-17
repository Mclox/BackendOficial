const { sql, poolPromise } = require('../../config/db');

class AppointmentModel {
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT c.*, ISNULL(u_cli.nombre, cl.nombre_invitado) as cliente_nombre, u_bar.nombre as barbero_nombre, s.nombre as servicio_nombre
            FROM Citas c
            LEFT JOIN Clientes cl ON c.id_cliente = cl.id_cliente
            LEFT JOIN Usuarios u_cli ON cl.id_usuario = u_cli.id_usuario
            LEFT JOIN Barberos b ON c.id_barbero = b.id_barbero
            LEFT JOIN Usuarios u_bar ON b.id_usuario = u_bar.id_usuario
            LEFT JOIN Servicios s ON c.id_servicio = s.id_servicio
            ORDER BY c.fecha DESC, c.hora_inicio DESC
        `);
        return result.recordset;
    }

    static async create(data) {
        const pool = await poolPromise;
        const { id_cliente, id_barbero, id_servicio, fecha, hora_inicio, hora_fin, detalles_json } = data;
        const detallesStr = typeof detalles_json === 'object' ? JSON.stringify(detalles_json) : detalles_json;

        const result = await pool.request()
            .input('id_cli', sql.Int, id_cliente)
            .input('id_bar', sql.Int, id_barbero)
            .input('id_ser', sql.Int, id_servicio)
            .input('fec', sql.Date, fecha)
            .input('hor_i', sql.VarChar, hora_inicio) // Usamos VarChar para evitar el error de formato Time
            .input('hor_f', sql.VarChar, hora_fin)
            .input('detalles', sql.NVarChar, detallesStr || null)
            .query(`
                DECLARE @newId INT = (SELECT ISNULL(MAX(id_cita), 0) + 1 FROM Citas);
                INSERT INTO Citas (id_cita, id_cliente, id_barbero, id_servicio, fecha, hora_inicio, hora_fin, estado, detalles_json)
                VALUES (@newId, @id_cli, @id_bar, @id_ser, @fec, @hor_i, @hor_f, 'pendiente', @detalles);
                SELECT @newId AS insertId;
            `);
        return result.recordset[0].insertId;
    }

    static async update(id, data) {
        const pool = await poolPromise;
        const { id_cliente, id_barbero, id_servicio, fecha, hora_inicio, hora_fin, detalles_json } = data;
        const detallesStr = typeof detalles_json === 'object' ? JSON.stringify(detalles_json) : detalles_json;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('id_cli', sql.Int, id_cliente)
            .input('id_bar', sql.Int, id_barbero)
            .input('id_ser', sql.Int, id_servicio)
            .input('fec', sql.Date, fecha)
            .input('hor_i', sql.VarChar, hora_inicio)
            .input('hor_f', sql.VarChar, hora_fin)
            .input('detalles', sql.NVarChar, detallesStr || null)
            .query(`
                UPDATE Citas 
                SET id_cliente = @id_cli, id_barbero = @id_bar, id_servicio = @id_ser, 
                    fecha = @fec, hora_inicio = @hor_i, hora_fin = @hor_f, detalles_json = @detalles
                WHERE id_cita = @id
            `);
        return result.rowsAffected[0] > 0;
    }

    static async updateStatus(id, estado) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('est', sql.VarChar, estado)
            .query(`UPDATE Citas SET estado = @est WHERE id_cita = @id`);
        return result.rowsAffected[0] > 0;
    }

    static async delete(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM Citas WHERE id_cita = @id`);
        return result.rowsAffected[0] > 0;
    }
}
module.exports = AppointmentModel;