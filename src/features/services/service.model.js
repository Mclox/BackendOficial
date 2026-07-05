const db = require('../../config/db');

class ServiceModel {
    static async getAll() {
        const result = await db.query('SELECT * FROM Servicios ORDER BY id_servicio ASC');
        return result.rows;
    }

    static async getById(id) {
        const result = await db.query('SELECT * FROM Servicios WHERE id_servicio = $1', [id]);
        return result.rows[0];
    }

    static async create(data) {
        const { nombre, precio_neto, iva_porcentaje, duracion_minutos, estado, descripcion } = data;

        const query = `
            INSERT INTO Servicios (nombre, precio_neto, iva_porcentaje, duracion_minutos, estado, descripcion)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id_servicio
        `;
        
        const values = [
            nombre,
            precio_neto,
            iva_porcentaje !== undefined ? iva_porcentaje : 0.00,
            duracion_minutos,
            estado || 'Activo',
            descripcion || null
        ];

        const result = await db.query(query, values);
        return result.rows[0].id_servicio;
    }

    static async update(id, data) {
        const { nombre, precio_neto, iva_porcentaje, duracion_minutos, estado, descripcion } = data;

        const query = `
            UPDATE Servicios 
            SET nombre = $1, precio_neto = $2, iva_porcentaje = $3, 
                duracion_minutos = $4, estado = $5, descripcion = $6
            WHERE id_servicio = $7
        `;
        
        const values = [
            nombre,
            precio_neto,
            iva_porcentaje !== undefined ? iva_porcentaje : 0.00,
            duracion_minutos,
            estado || 'Activo',
            descripcion || null,
            id
        ];

        const result = await db.query(query, values);
        return result.rowCount > 0;
    }

    static async delete(id) {
        const result = await db.query('DELETE FROM Servicios WHERE id_servicio = $1', [id]);
        return result.rowCount > 0;
    }
}

module.exports = ServiceModel;