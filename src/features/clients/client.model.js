const db = require('../../config/db');

class ClientModel {
    /**
     * Obtiene todos los clientes cruzando los datos con Usuarios (si es registrado) o trayendo los datos de invitado.
     */
    static async getAll() {
        const query = `
            SELECT c.id_cliente, c.id_usuario, 
                   COALESCE(u.nombre, c.nombre_invitado) as nombre_final,
                   COALESCE(u.telefono, c.telefono_invitado) as telefono_final,
                   COALESCE(u.email, c.email_invitado) as email_final,
                   COALESCE(u.tipo_documento, c.tipo_documento) as tipo_documento,
                   COALESCE(u.documento, c.documento) as documento,
                   u.direccion,
                   COALESCE(u.estado, 'Activo') as estado
            FROM Clientes c
            LEFT JOIN Usuarios u ON c.id_usuario = u.id_usuario
            ORDER BY c.id_cliente ASC
        `;
        const result = await db.query(query);
        return result.rows;
    }

    /**
     * Obtiene un cliente específico por ID.
     */
    static async getById(id) {
        const query = `
            SELECT c.id_cliente, c.id_usuario, 
                   COALESCE(u.nombre, c.nombre_invitado) as nombre_final,
                   COALESCE(u.telefono, c.telefono_invitado) as telefono_final,
                   COALESCE(u.email, c.email_invitado) as email_final,
                   COALESCE(u.tipo_documento, c.tipo_documento) as tipo_documento,
                   COALESCE(u.documento, c.documento) as documento,
                   u.direccion,
                   COALESCE(u.estado, 'Activo') as estado
            FROM Clientes c
            LEFT JOIN Usuarios u ON c.id_usuario = u.id_usuario
            WHERE c.id_cliente = $1
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    /**
     * Registra un nuevo cliente (invitado o asociado a un usuario).
     */
    static async create(data) {
        const { id_usuario, nombre_invitado, telefono_invitado, email_invitado, tipo_documento, documento } = data;

        const query = `
            INSERT INTO Clientes (id_usuario, nombre_invitado, telefono_invitado, email_invitado, tipo_documento, documento)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id_cliente as id
        `;
        
        const values = [
            id_usuario || null, 
            nombre_invitado || null, 
            telefono_invitado || null, 
            email_invitado || null, 
            tipo_documento || null, 
            documento || null
        ];
        
        const result = await db.query(query, values);
        return result.rows[0].id;
    }

    /**
     * Actualiza un cliente. Si tiene usuario asociado, actualiza la tabla Usuarios mediante una transacción.
     */
    static async update(id, data) {
        const { id_usuario, nombre, telefono, email, tipo_documento, documento, direccion, contrasena } = data;
        
        if (id_usuario) {
            const client = await db.pool.connect();
            try {
                await client.query('BEGIN');

                let queryUser = `
                    UPDATE Usuarios 
                    SET nombre = $1, telefono = $2, email = $3, tipo_documento = $4, documento = $5, direccion = $6
                `;
                const valuesUser = [nombre, telefono, email, tipo_documento || 'CC', documento || null, direccion || null];
                
                if (contrasena && contrasena.trim()) {
                    valuesUser.push(contrasena);
                    queryUser += `, contrasena = $${valuesUser.length}`;
                }

                valuesUser.push(id_usuario);
                queryUser += ` WHERE id_usuario = $${valuesUser.length}`;

                await client.query(queryUser, valuesUser);
                
                await client.query('COMMIT');
                return true;
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            } finally {
                client.release();
            }
        } else {
            const query = `
                UPDATE Clientes 
                SET nombre_invitado = $1, telefono_invitado = $2, email_invitado = $3
                WHERE id_cliente = $4
            `;
            const result = await db.query(query, [nombre, telefono, email, id]);
            return result.rowCount > 0;
        }
    }

    /**
     * Elimina un cliente. Si tiene usuario, también lo borra en cascada mediante una transacción.
     */
    static async delete(id) {
        const getRes = await db.query('SELECT id_usuario FROM Clientes WHERE id_cliente = $1', [id]);
        if (getRes.rows.length === 0) return false;
        const id_usuario = getRes.rows[0].id_usuario;

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            await client.query('DELETE FROM Clientes WHERE id_cliente = $1', [id]);

            if (id_usuario) {
                await client.query('DELETE FROM Usuarios WHERE id_usuario = $1', [id_usuario]);
            }

            await client.query('COMMIT');
            return true;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Helper para autocompletar el perfil de cliente cuando un usuario se registra.
     */
    static async getOrCreateByUsuario(id_usuario) {
        const getRes = await db.query('SELECT * FROM Clientes WHERE id_usuario = $1', [id_usuario]);
        if (getRes.rows.length > 0) return;
        
        const userRes = await db.query('SELECT nombre, email, telefono, tipo_documento, documento FROM Usuarios WHERE id_usuario = $1', [id_usuario]);
        if (userRes.rows.length > 0) {
            const u = userRes.rows[0];
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