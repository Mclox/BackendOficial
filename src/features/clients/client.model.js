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
        // Unimos con Usuarios para obtener los datos si es registrado, sino mostramos los de invitado
        const result = await pool.request().query(`
            SELECT c.id_cliente, c.id_usuario, 
                   ISNULL(u.nombre, c.nombre_invitado) as nombre_final,
                   ISNULL(u.telefono, c.telefono_invitado) as telefono_final,
                   ISNULL(u.email, c.email_invitado) as email_final
            FROM Clientes c
            LEFT JOIN Usuarios u ON c.id_usuario = u.id_usuario
        `);
        return result.recordset;
    }

    static async create(data) {
        const pool = await poolPromise;
        const { id_usuario, nombre_invitado, telefono_invitado, email_invitado } = data;

        const result = await pool.request()
            .input('id_u', sql.Int, id_usuario || null)
            .input('nom_i', sql.VarChar, nombre_invitado || null)
            .input('tel_i', sql.VarChar, telefono_invitado || null)
            .input('eml_i', sql.VarChar, email_invitado || null)
            .query(`
                DECLARE @newId INT = (SELECT ISNULL(MAX(id_cliente), 0) + 1 FROM Clientes);
                INSERT INTO Clientes (id_cliente, id_usuario, nombre_invitado, telefono_invitado, email_invitado)
                VALUES (@newId, @id_u, @nom_i, @tel_i, @eml_i);
                SELECT @newId as id;
            `);
        return result.recordset[0].id;
    }
}
module.exports = ClientModel;