// const { sql, poolPromise } = require('../../config/db');

// class ClientModel {
//     static async getAll() {
//         const pool = await poolPromise;
//         return (await pool.request().query('SELECT * FROM Clientes')).recordset;
//     }

//     static async create(data) {
//         const pool = await poolPromise;
//         const { id_usuario, nombre, telefono, email } = data;
//         const result = await pool.request()
//             .input('id_u', sql.Int, id_usuario || null)
//             .input('nom', sql.VarChar, nombre)
//             .input('tel', sql.VarChar, telefono)
//             .input('eml', sql.VarChar, email)
//             .query(`
//                 DECLARE @newId INT = (SELECT ISNULL(MAX(id_cliente), 0) + 1 FROM Clientes);
//                 INSERT INTO Clientes (id_cliente, id_usuario, nombre, telefono, email, estado)
//                 VALUES (@newId, @id_u, @nom, @tel, @eml, 'Activo');
//                 SELECT @newId as id;
//             `);
//         return result.recordset[0].id;
//     }
// }
// module.exports = ClientModel;

const { sql, poolPromise } = require('../../config/db');

class ClientModel {
    static async getAll() {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Clientes');
        return result.recordset;
    }

    static async getById(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Clientes WHERE id_cliente = @id');
        return result.recordset[0];
    }

    static async create(data) {
        const pool = await poolPromise;
        const { id_usuario, nombre, telefono, email, estado } = data;

        const result = await pool.request()
            .input('id_usu', sql.Int, id_usuario || null)
            .input('nom', sql.VarChar, nombre)
            .input('tel', sql.VarChar, telefono || null)
            .input('ema', sql.VarChar, email || null)
            .input('est', sql.VarChar, estado || 'Activo')
            .query(`
                DECLARE @newId INT;
                SELECT @newId = ISNULL(MAX(id_cliente), 0) + 1 FROM Clientes;

                INSERT INTO Clientes (id_cliente, id_usuario, nombre, telefono, email, estado)
                VALUES (@newId, @id_usu, @nom, @tel, @ema, @est);

                SELECT @newId AS insertId;
            `);
        return result.recordset[0].insertId;
    }

    static async update(id, data) {
        const pool = await poolPromise;
        const { id_usuario, nombre, telefono, email, estado } = data;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('id_usu', sql.Int, id_usuario || null)
            .input('nom', sql.VarChar, nombre)
            .input('tel', sql.VarChar, telefono || null)
            .input('ema', sql.VarChar, email || null)
            .input('est', sql.VarChar, estado || 'Activo')
            .query(`
                UPDATE Clientes 
                SET id_usuario = @id_usu, nombre = @nom, telefono = @tel, email = @ema, estado = @est
                WHERE id_cliente = @id
            `);
        return result.rowsAffected[0] > 0;
    }

    static async delete(id) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Clientes WHERE id_cliente = @id');
        return result.rowsAffected[0] > 0;
    }
}
module.exports = ClientModel;