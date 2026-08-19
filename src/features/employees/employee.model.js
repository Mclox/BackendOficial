const db = require('../../config/db');

class EmployeeModel {
    static async getAll() {
        const result = await db.query(`
            SELECT b.id_barbero, b.id_barbero as id_empleado, b.id_usuario, b.estado, b.tipo_contrato as tipo_esquema, 
                   b.porcentaje_ganancia as porcentaje_comision, b.hora_inicio, b.hora_fin,
                   u.nombre, u.email, u.telefono, u.direccion, 'Barbero' as cargo, '' as apellido,
                   u.tipo_documento, u.documento
            FROM Barberos b
            JOIN Usuarios u ON b.id_usuario = u.id_usuario
            ORDER BY b.id_barbero ASC
        `);
        return result.rows;
    }

    static async create(data) {
        const { 
            primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, 
            tipo_documento, documento, email, telefono, direccion, contrasena,
            tipo_esquema, porcentaje_comision 
        } = data;
        
        const nombreCompleto = [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido]
            .filter(Boolean)
            .map(s => s.trim())
            .join(' ');
            
        const docVal = documento || ('BARB-' + Date.now());
        const tipoDocVal = tipo_documento || 'CC';
        const passVal = contrasena || 'barbero123';

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Crear el Usuario (Rol 2 = Barbero)
            const userQuery = `
                INSERT INTO Usuarios (id_rol, nombre, tipo_documento, documento, email, telefono, contrasena, direccion, estado)
                VALUES (2, $1, $2, $3, $4, $5, $6, $7, 'Activo')
                RETURNING id_usuario
            `;
            const userRes = await client.query(userQuery, [
                nombreCompleto, 
                tipoDocVal, 
                docVal, 
                email || null, 
                telefono || null, 
                passVal, 
                direccion || null
            ]);
            const newUserId = userRes.rows[0].id_usuario;

            // 2. Crear el Barbero
            const barbQuery = `
                INSERT INTO Barberos (id_usuario, estado, tipo_contrato, porcentaje_ganancia)
                VALUES ($1, 'Activo', $2, $3)
                RETURNING id_barbero
            `;
            const barbRes = await client.query(barbQuery, [
                newUserId, 
                tipo_esquema || 'porcentaje', 
                porcentaje_comision || null
            ]);
            const newBarbId = barbRes.rows[0].id_barbero;

            await client.query('COMMIT');
            return newBarbId;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async update(id, data) {
        const { 
            primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, 
            tipo_documento, documento, email, telefono, direccion, contrasena,
            tipo_esquema, porcentaje_comision 
        } = data;
        
        const nombreCompleto = [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido]
            .filter(Boolean)
            .map(s => s.trim())
            .join(' ');

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Obtener id_usuario a partir del id_barbero
            const getRes = await client.query("SELECT id_usuario FROM Barberos WHERE id_barbero = $1", [id]);
            if (getRes.rows.length === 0) {
                throw new Error('Empleado no encontrado');
            }
            const id_usuario = getRes.rows[0].id_usuario;

            // 2. Actualizar la tabla Usuarios
            let queryUser = `
                UPDATE Usuarios 
                SET nombre = $1, email = $2, telefono = $3, documento = $4, tipo_documento = $5, direccion = $6
            `;
            const valuesUser = [nombreCompleto, email || null, telefono || null, documento || null, tipo_documento || null, direccion || null];
            
            if (contrasena && contrasena.trim()) {
                valuesUser.push(contrasena);
                queryUser += `, contrasena = $${valuesUser.length}`;
            }
            
            valuesUser.push(id_usuario);
            queryUser += ` WHERE id_usuario = $${valuesUser.length}`;
            await client.query(queryUser, valuesUser);

            // 3. Actualizar la tabla Barberos
            await client.query(`
                UPDATE Barberos 
                SET tipo_contrato = $1, porcentaje_ganancia = $2
                WHERE id_barbero = $3
            `, [tipo_esquema, porcentaje_comision || null, id]);

            await client.query('COMMIT');
            return true;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async toggleStatus(id, estado) {
        const result = await db.query('UPDATE Barberos SET estado = $1 WHERE id_barbero = $2', [estado, id]);
        return result.rowCount > 0;
    }
}

module.exports = EmployeeModel;