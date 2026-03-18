const { poolPromise } = require('../../config/db');
const sql = require('mssql');

class ProductEntryModel {
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                E.id_entrada, E.cantidad, E.fecha, E.observaciones, E.estado, 
                E.motivo_anulacion, E.fecha_anulacion, E.id_producto,
                P.nombre AS producto_nombre,
                U.nombre AS nombre_usuario
            FROM Entradas_Productos E
            INNER JOIN Productos P ON E.id_producto = P.id_producto
            INNER JOIN Usuarios U ON E.id_usuario = U.id_usuario
            ORDER BY E.fecha DESC
        `);
        return result.recordset;
    }

    // static async create(data) {
    //     const pool = await poolPromise;
    //     const result = await pool.request()
    //         .input('id_producto', sql.Int, data.id_producto)
    //         .input('id_usuario', sql.Int, data.id_usuario)
    //         .input('cantidad', sql.Int, data.cantidad)
    //         .input('observaciones', sql.VarChar(255), data.observaciones || null)
    //         .query(`
    //             INSERT INTO Entradas_Productos (id_producto, id_usuario, cantidad, observaciones)
    //             OUTPUT INSERTED.*
    //             VALUES (@id_producto, @id_usuario, @cantidad, @observaciones)
    //         `);
    //     return result.recordset[0];
    // }

    static async create(data) {
        const pool = await poolPromise;
        
        // 1. Insertar el registro normal
        await pool.request()
            .input('id_producto', sql.Int, data.id_producto)
            .input('id_usuario', sql.Int, data.id_usuario)
            .input('cantidad', sql.Int, data.cantidad)
            .input('observaciones', sql.VarChar(255), data.observaciones || null)
            .query(`
                INSERT INTO Entradas_Productos (id_producto, id_usuario, cantidad, observaciones)
                VALUES (@id_producto, @id_usuario, @cantidad, @observaciones)
            `);

        // 2. Obtener el último registro insertado (el recién creado)
        const result = await pool.request().query(`
            SELECT TOP 1 * FROM Entradas_Productos ORDER BY id_entrada DESC
        `);
        
        return result.recordset[0];
    }
    
    static async annul(id_entrada, motivo_anulacion) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id_entrada', sql.Int, id_entrada)
            .input('motivo_anulacion', sql.VarChar(255), motivo_anulacion)
            .query(`
                UPDATE Entradas_Productos
                SET estado = 'Anulado', 
                    motivo_anulacion = @motivo_anulacion, 
                    fecha_anulacion = CURRENT_TIMESTAMP
                OUTPUT INSERTED.*
                WHERE id_entrada = @id_entrada AND estado = 'Activo'
            `);
        return result.recordset[0];
    }
}

module.exports = ProductEntryModel;