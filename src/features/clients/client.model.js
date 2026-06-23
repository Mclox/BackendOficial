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
                   ISNULL(u.email, c.email_invitado) as email_final,
                   ISNULL(u.tipo_documento, c.tipo_documento) as tipo_documento,
                   ISNULL(u.documento, c.documento) as documento,
                   u.direccion,
                   ISNULL(u.estado, 'Activo') as estado
            FROM Clientes c
            LEFT JOIN Usuarios u ON c.id_usuario = u.id_usuario
        `);
        return result.recordset;
    }

    static async create(data) {
        const pool = await poolPromise;
        const { id_usuario, nombre_invitado, telefono_invitado, email_invitado, tipo_documento, documento } = data;

        const result = await pool.request()
            .input('id_u', sql.Int, id_usuario || null)
            .input('nom_i', sql.VarChar, nombre_invitado || null)
            .input('tel_i', sql.VarChar, telefono_invitado || null)
            .input('eml_i', sql.VarChar, email_invitado || null)
            .input('tipo_doc', sql.VarChar, tipo_documento || null)
            .input('doc', sql.VarChar, documento || null)
            .query(`
                DECLARE @newId INT = (SELECT ISNULL(MAX(id_cliente), 0) + 1 FROM Clientes);
                INSERT INTO Clientes (id_cliente, id_usuario, nombre_invitado, telefono_invitado, email_invitado, tipo_documento, documento)
                VALUES (@newId, @id_u, @nom_i, @tel_i, @eml_i, @tipo_doc, @doc);
                SELECT @newId as id;
            `);
        return result.recordset[0].id;
    }

    static async update(id, data) {
        const pool = await poolPromise;
        const { id_usuario, nombre, telefono, email, tipo_documento, documento, direccion, contrasena } = data;
        
        // Si el cliente está registrado (tiene id_usuario), actualizamos sus datos en la tabla Usuarios
        if (id_usuario) {
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            try {
                const reqUser = new sql.Request(transaction);
                reqUser
                    .input('id_u', sql.Int, id_usuario)
                    .input('nom', sql.VarChar, nombre)
                    .input('tel', sql.VarChar, telefono)
                    .input('eml', sql.VarChar, email)
                    .input('tipo_doc', sql.VarChar, tipo_documento || 'CC')
                    .input('doc', sql.VarChar, documento || null)
                    .input('dir', sql.VarChar, direccion || null);
                
                let queryUser = `
                    UPDATE Usuarios 
                    SET nombre = @nom, telefono = @tel, email = @eml, tipo_documento = @tipo_doc, documento = @doc, direccion = @dir
                `;
                
                if (contrasena && contrasena.trim()) {
                    reqUser.input('pwd', sql.VarChar, contrasena);
                    queryUser += ", contrasena = @pwd";
                }
                
                queryUser += " WHERE id_usuario = @id_u";
                await reqUser.query(queryUser);
                
                await transaction.commit();
                return true;
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } else {
            // Si es un invitado, actualizamos los datos de invitado en la tabla Clientes
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('nom', sql.VarChar, nombre)
                .input('tel', sql.VarChar, telefono)
                .input('eml', sql.VarChar, email)
                .query(`
                    UPDATE Clientes 
                    SET nombre_invitado = @nom, telefono_invitado = @tel, email_invitado = @eml
                    WHERE id_cliente = @id
                `);
            return result.rowsAffected[0] > 0;
        }
    }

    static async delete(id) {
        const pool = await poolPromise;
        
        // Obtener el id_usuario del cliente para eliminarlo también de Usuarios si es registrado
        const getRes = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT id_usuario FROM Clientes WHERE id_cliente = @id');
        
        if (getRes.recordset.length === 0) return false;
        const id_usuario = getRes.recordset[0].id_usuario;

        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            // 1. Eliminar de Clientes
            const reqCli = new sql.Request(transaction);
            await reqCli
                .input('id', sql.Int, id)
                .query('DELETE FROM Clientes WHERE id_cliente = @id');

            // 2. Si tenía usuario, eliminar de Usuarios
            if (id_usuario) {
                const reqUser = new sql.Request(transaction);
                await reqUser
                    .input('id_u', sql.Int, id_usuario)
                    .query('DELETE FROM Usuarios WHERE id_usuario = @id_u');
            }
            await transaction.commit();
            return true;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    static async getOrCreateByUsuario(id_usuario) {
        const pool = await poolPromise;
        const getRes = await pool.request()
            .input('id_u', sql.Int, id_usuario)
            .query('SELECT * FROM Clientes WHERE id_usuario = @id_u');
            
        if (getRes.recordset.length > 0) {
            return;
        }
        
        const userRes = await pool.request()
            .input('id_u', sql.Int, id_usuario)
            .query('SELECT nombre, email, telefono, tipo_documento, documento FROM Usuarios WHERE id_usuario = @id_u');
            
        if (userRes.recordset.length > 0) {
            const u = userRes.recordset[0];
            await this.create({
                id_usuario,
                nombre_invitado: null,
                telefono_invitado: null,
                email_invitado: null,
                tipo_documento: u.tipo_documento,
                documento: u.documento
            });
        }
    }
}
module.exports = ClientModel;