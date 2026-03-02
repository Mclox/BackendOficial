const { sql, poolPromise } = require('../../config/db');

class ClientModel {
    static async getAll() {
        const pool = await poolPromise;
        return (await pool.request().query('SELECT * FROM Clientes')).recordset;
    }

    static async create(data) {
        const pool = await poolPromise;
        const { id_usuario, nombre, telefono, email } = data;
        const result = await pool.request()
            .input('id_u', sql.Int, id_usuario || null)
            .input('nom', sql.VarChar, nombre)
            .input('tel', sql.VarChar, telefono)
            .input('eml', sql.VarChar, email)
            .query(`
                DECLARE @newId INT = (SELECT ISNULL(MAX(id_cliente), 0) + 1 FROM Clientes);
                INSERT INTO Clientes (id_cliente, id_usuario, nombre, telefono, email, estado)
                VALUES (@newId, @id_u, @nom, @tel, @eml, 'Activo');
                SELECT @newId as id;
            `);
        return result.recordset[0].id;
    }
}
module.exports = ClientModel;