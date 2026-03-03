const { sql, poolPromise } = require('../../config/db');

class ServiceModel {
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Servicios');
        return result.recordset;
    }

    static async getById(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Servicios WHERE id_servicio = @id');
        return result.recordset[0];
    }

    static async create(data) {
        const pool = await poolPromise;
        const { nombre, precio_neto, iva_porcentaje, duracion_minutos } = data;

        const result = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('pre_neto', sql.Decimal(12,2), precio_neto)
            .input('iva', sql.Decimal(5,2), iva_porcentaje || 0.00)
            .input('duracion', sql.Int, duracion_minutos)
            .query(`
                DECLARE @newId INT = (SELECT ISNULL(MAX(id_servicio), 0) + 1 FROM Servicios);
                INSERT INTO Servicios (id_servicio, nombre, precio_neto, iva_porcentaje, duracion_minutos)
                VALUES (@newId, @nombre, @pre_neto, @iva, @duracion);
                SELECT @newId AS insertId;
            `);
        return result.recordset[0].insertId;
    }

    static async update(id, data) {
        const pool = await poolPromise;
        const { nombre, precio_neto, iva_porcentaje, duracion_minutos } = data;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.VarChar, nombre)
            .input('pre_neto', sql.Decimal(12,2), precio_neto)
            .input('iva', sql.Decimal(5,2), iva_porcentaje || 0.00)
            .input('duracion', sql.Int, duracion_minutos)
            .query(`
                UPDATE Servicios 
                SET nombre = @nombre, precio_neto = @pre_neto, 
                    iva_porcentaje = @iva, duracion_minutos = @duracion
                WHERE id_servicio = @id
            `);
        return result.rowsAffected[0] > 0;
    }

    static async delete(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Servicios WHERE id_servicio = @id');
        return result.rowsAffected[0] > 0;
    }
}
module.exports = ServiceModel;