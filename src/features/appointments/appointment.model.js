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
        const { id_cliente, id_barbero, id_servicio, fecha, hora_inicio, hora_fin } = data;

        const result = await pool.request()
            .input('id_cli', sql.Int, id_cliente)
            .input('id_bar', sql.Int, id_barbero)
            .input('id_ser', sql.Int, id_servicio)
            .input('fec', sql.Date, fecha)
            .input('hor_i', sql.VarChar, hora_inicio) // <-- CAMBIO AQUÍ (VarChar en lugar de Time)
            .input('hor_f', sql.VarChar, hora_fin)    // <-- CAMBIO AQUÍ (VarChar en lugar de Time)
            .query(`
                DECLARE @newId INT = (SELECT ISNULL(MAX(id_cita), 0) + 1 FROM Citas);
                INSERT INTO Citas (id_cita, id_cliente, id_barbero, id_servicio, fecha, hora_inicio, hora_fin, estado)
                VALUES (@newId, @id_cli, @id_bar, @id_ser, @fec, @hor_i, @hor_f, 'pendiente');
                SELECT @newId AS insertId;
            `);
        return result.recordset[0].insertId;
    }
    }
    // ... updateStatus queda igual
module.exports = AppointmentModel;