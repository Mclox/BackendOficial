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
        const { nombre, descripcion, precio, duracion, porcentaje_barbero } = data;

        const result = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('descripcion', sql.VarChar, descripcion || null)
            .input('precio', sql.Decimal(12,2), precio)
            .input('duracion', sql.Int, duracion || null)
            .input('porcentaje_barbero', sql.Decimal(5,2), porcentaje_barbero || null)
            .query(`
                DECLARE @newId INT;
                SELECT @newId = ISNULL(MAX(id_servicio), 0) + 1 FROM Servicios;
                
                INSERT INTO Servicios (id_servicio, nombre, descripcion, precio, duracion, porcentaje_barbero)
                VALUES (@newId, @nombre, @descripcion, @precio, @duracion, @porcentaje_barbero);
                
                SELECT @newId AS insertId;
            `);
        return result.recordset[0].insertId;
    }

    static async update(id, data) {
        const pool = await poolPromise;
        const { nombre, descripcion, precio, duracion, porcentaje_barbero } = data;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('nombre', sql.VarChar, nombre)
            .input('descripcion', sql.VarChar, descripcion || null)
            .input('precio', sql.Decimal(12,2), precio)
            .input('duracion', sql.Int, duracion || null)
            .input('porcentaje_barbero', sql.Decimal(5,2), porcentaje_barbero || null)
            .query(`
                UPDATE Servicios 
                SET nombre = @nombre, descripcion = @descripcion, precio = @precio, 
                    duracion = @duracion, porcentaje_barbero = @porcentaje_barbero
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