const { sql, poolPromise } = require('../../config/db');

class AppointmentModel {
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT c.*, cl.nombre as cliente_nombre, b.id_usuario, u.nombre as barbero_nombre, s.nombre as servicio_nombre
            FROM Citas c
            LEFT JOIN Clientes cl ON c.id_cliente = cl.id_cliente
            LEFT JOIN Barberos b ON c.id_barbero = b.id_barbero
            LEFT JOIN Usuarios u ON b.id_usuario = u.id_usuario
            LEFT JOIN Servicios s ON c.id_servicio = s.id_servicio
            ORDER BY c.fecha DESC, c.hora DESC
        `);
        return result.recordset;
    }

    static async create(data) {
        const pool = await poolPromise;
        const { id_cliente, id_barbero, id_servicio, fecha, hora } = data;

        const result = await pool.request()
            .input('id_cli', sql.Int, id_cliente)
            .input('id_bar', sql.Int, id_barbero)
            .input('id_ser', sql.Int, id_servicio || null)
            .input('fec', sql.Date, fecha)
            .input('hor', sql.Time, hora)
            .query(`
                DECLARE @newId INT = (SELECT ISNULL(MAX(id_cita), 0) + 1 FROM Citas);
                INSERT INTO Citas (id_cita, id_cliente, id_barbero, id_servicio, fecha, hora, estado, notificado)
                VALUES (@newId, @id_cli, @id_bar, @id_ser, @fec, @hor, 'pendiente', 0);
                SELECT @newId AS insertId;
            `);
        return result.recordset[0].insertId;
    }

    static async updateStatus(id, estado) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('est', sql.VarChar, estado)
            .query(`UPDATE Citas SET estado = @est WHERE id_cita = @id`);
        return result.rowsAffected[0] > 0;
    }
}
module.exports = AppointmentModel;