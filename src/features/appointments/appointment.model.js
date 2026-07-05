const db = require('../../config/db');

class AppointmentModel {
    static async getAll() {
        const result = await db.query(`
            SELECT c.*, COALESCE(u_cli.nombre, cl.nombre_invitado) as cliente_nombre, u_bar.nombre as barbero_nombre, s.nombre as servicio_nombre
            FROM Citas c
            LEFT JOIN Clientes cl ON c.id_cliente = cl.id_cliente
            LEFT JOIN Usuarios u_cli ON cl.id_usuario = u_cli.id_usuario
            LEFT JOIN Barberos b ON c.id_barbero = b.id_barbero
            LEFT JOIN Usuarios u_bar ON b.id_usuario = u_bar.id_usuario
            LEFT JOIN Servicios s ON c.id_servicio = s.id_servicio
            ORDER BY c.fecha DESC, c.hora_inicio DESC
        `);
        return result.rows;
    }

    static async create(data) {
        const { id_cliente, id_barbero, id_servicio, fecha, hora_inicio, hora_fin, detalles_json } = data;
        const detallesStr = typeof detalles_json === 'object' ? JSON.stringify(detalles_json) : detalles_json;

        const query = `
            INSERT INTO Citas (id_cliente, id_barbero, id_servicio, fecha, hora_inicio, hora_fin, estado, detalles_json)
            VALUES ($1, $2, $3, $4, $5, $6, 'pendiente', $7)
            RETURNING id_cita
        `;
        
        const values = [id_cliente, id_barbero, id_servicio, fecha, hora_inicio, hora_fin, detallesStr || null];
        const result = await db.query(query, values);
        return result.rows[0].id_cita;
    }

    static async update(id, data) {
        const { id_cliente, id_barbero, id_servicio, fecha, hora_inicio, hora_fin, detalles_json, estado } = data;
        const detallesStr = typeof detalles_json === 'object' ? JSON.stringify(detalles_json) : detalles_json;

        let query = `
            UPDATE Citas 
            SET id_cliente = $1, id_barbero = $2, id_servicio = $3, 
                fecha = $4, hora_inicio = $5, hora_fin = $6, detalles_json = $7
        `;
        
        const values = [id_cliente, id_barbero, id_servicio, fecha, hora_inicio, hora_fin, detallesStr || null];

        if (estado) {
            values.push(estado);
            query += `, estado = $${values.length}`;
        }

        values.push(id);
        query += ` WHERE id_cita = $${values.length}`;

        const result = await db.query(query, values);
        return result.rowCount > 0;
    }

    static async updateStatus(id, estado) {
        const result = await db.query('UPDATE Citas SET estado = $1 WHERE id_cita = $2', [estado, id]);
        return result.rowCount > 0;
    }

    static async delete(id) {
        const result = await db.query('DELETE FROM Citas WHERE id_cita = $1', [id]);
        return result.rowCount > 0;
    }
}

module.exports = AppointmentModel;