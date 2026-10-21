const db = require('../../config/db');

class EmployeeModel {
    static async getAll() {
        const result = await db.query(`
            SELECT COALESCE(b.id_barbero, u.id_usuario) as id_barbero, 
                   COALESCE(b.id_barbero, u.id_usuario) as id_empleado, 
                   u.id_usuario, 
                   COALESCE(b.estado, u.estado) as estado, 
                   COALESCE(b.tipo_contrato, 'porcentaje') as tipo_esquema, 
                   b.porcentaje_ganancia as porcentaje_comision, 
                   COALESCE(to_char(b.hora_inicio, 'HH24:MI'), '09:00') as hora_inicio, 
                   COALESCE(to_char(b.hora_fin, 'HH24:MI'), '21:00') as hora_fin,
                   COALESCE(b.dias_laborales, '[]'::jsonb) as dias_laborales,
                   COALESCE(b.bloqueos, '[]'::jsonb) as bloqueos,
                   u.nombre, u.email, u.telefono, u.direccion, 
                   r.nombre as cargo, '' as apellido,
                   u.tipo_documento, u.documento
            FROM Usuarios u
            JOIN Roles r ON u.id_rol = r.id_rol
            LEFT JOIN Barberos b ON u.id_usuario = b.id_usuario
            WHERE LOWER(r.nombre) IN ('barbero', 'administrador') OR u.id_rol IN (1, 2)
            ORDER BY u.id_usuario ASC
        `);
        return result.rows;
    }

    static async create(data) {
        const { 
            primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, 
            tipo_documento, documento, email, telefono, direccion, contrasena,
            tipo_esquema, porcentaje_comision, hora_inicio, hora_fin,
            dias_laborales, bloqueos 
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

            const barbQuery = `
                INSERT INTO Barberos (id_usuario, estado, tipo_contrato, porcentaje_ganancia, hora_inicio, hora_fin, dias_laborales, bloqueos)
                VALUES ($1, 'Activo', $2, $3, $4::time, $5::time, $6::jsonb, $7::jsonb)
                RETURNING id_barbero
            `;
            const barbRes = await client.query(barbQuery, [
                newUserId, 
                tipo_esquema || 'porcentaje', 
                porcentaje_comision || null,
                (hora_inicio || '09:00').substring(0, 5),
                (hora_fin || '21:00').substring(0, 5),
                dias_laborales ? JSON.stringify(dias_laborales) : '[]',
                bloqueos ? JSON.stringify(bloqueos) : '[]'
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
            primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, nombre,
            tipo_documento, documento, email, telefono, direccion, contrasena,
            tipo_esquema, porcentaje_comision, hora_inicio, hora_fin,
            dias_laborales, bloqueos
        } = data;
        
        let nombreCompleto = [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido]
            .filter(Boolean)
            .map(s => s.trim())
            .join(' ');

        if (!nombreCompleto && nombre && typeof nombre === 'string') {
            nombreCompleto = nombre.trim();
        }

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            let id_usuario = null;
            let id_barbero = null;
            const getRes = await client.query(
                "SELECT id_usuario, id_barbero FROM Barberos WHERE id_barbero = $1 OR id_usuario = $1", 
                [id]
            );
            if (getRes.rows.length > 0) {
                id_usuario = getRes.rows[0].id_usuario;
                id_barbero = getRes.rows[0].id_barbero;
            } else {
                const uRes = await client.query("SELECT id_usuario FROM Usuarios WHERE id_usuario = $1", [id]);
                if (uRes.rows.length > 0) {
                    id_usuario = uRes.rows[0].id_usuario;
                } else {
                    throw new Error('Empleado no encontrado');
                }
            }

            if (nombreCompleto || email || telefono || documento || tipo_documento || direccion || contrasena) {
                let queryUser = "UPDATE Usuarios SET id_usuario = id_usuario";
                const valuesUser = [];

                if (nombreCompleto) {
                    valuesUser.push(nombreCompleto);
                    queryUser += `, nombre = $${valuesUser.length}`;
                }
                if (email) {
                    valuesUser.push(email);
                    queryUser += `, email = $${valuesUser.length}`;
                }
                if (telefono) {
                    valuesUser.push(telefono);
                    queryUser += `, telefono = $${valuesUser.length}`;
                }
                if (documento) {
                    valuesUser.push(documento);
                    queryUser += `, documento = $${valuesUser.length}`;
                }
                if (tipo_documento) {
                    valuesUser.push(tipo_documento);
                    queryUser += `, tipo_documento = $${valuesUser.length}`;
                }
                if (direccion) {
                    valuesUser.push(direccion);
                    queryUser += `, direccion = $${valuesUser.length}`;
                }
                if (contrasena && contrasena.trim()) {
                    valuesUser.push(contrasena);
                    queryUser += `, contrasena = $${valuesUser.length}`;
                }
                
                valuesUser.push(id_usuario);
                queryUser += ` WHERE id_usuario = $${valuesUser.length}`;
                await client.query(queryUser, valuesUser);
            }

            if (id_barbero) {
                let barbQuery = `
                    UPDATE Barberos 
                    SET tipo_contrato = COALESCE($1, tipo_contrato), 
                        porcentaje_ganancia = COALESCE($2, porcentaje_ganancia)
                `;
                const barbValues = [tipo_esquema || null, porcentaje_comision !== undefined ? porcentaje_comision : null];
                
                if (hora_inicio !== undefined && hora_inicio !== null) {
                    const cleanHStart = hora_inicio.toString().substring(0, 5);
                    barbValues.push(cleanHStart);
                    barbQuery += `, hora_inicio = $${barbValues.length}::time`;
                }
                if (hora_fin !== undefined && hora_fin !== null) {
                    const cleanHEnd = hora_fin.toString().substring(0, 5);
                    barbValues.push(cleanHEnd);
                    barbQuery += `, hora_fin = $${barbValues.length}::time`;
                }
                if (dias_laborales !== undefined && dias_laborales !== null) {
                    barbValues.push(typeof dias_laborales === 'object' ? JSON.stringify(dias_laborales) : dias_laborales);
                    barbQuery += `, dias_laborales = $${barbValues.length}::jsonb`;
                }
                if (bloqueos !== undefined && bloqueos !== null) {
                    barbValues.push(typeof bloqueos === 'object' ? JSON.stringify(bloqueos) : bloqueos);
                    barbQuery += `, bloqueos = $${barbValues.length}::jsonb`;
                }

                barbValues.push(id_barbero);
                barbQuery += ` WHERE id_barbero = $${barbValues.length}`;
                await client.query(barbQuery, barbValues);
            } else {
                const insQuery = `
                    INSERT INTO Barberos (id_usuario, estado, tipo_contrato, porcentaje_ganancia, hora_inicio, hora_fin, dias_laborales, bloqueos)
                    VALUES ($1, 'Activo', $2, $3, $4::time, $5::time, $6::jsonb, $7::jsonb)
                `;
                await client.query(insQuery, [
                    id_usuario,
                    tipo_esquema || 'porcentaje',
                    porcentaje_comision || null,
                    (hora_inicio || '09:00').substring(0, 5),
                    (hora_fin || '21:00').substring(0, 5),
                    dias_laborales ? JSON.stringify(dias_laborales) : '[]',
                    bloqueos ? JSON.stringify(bloqueos) : '[]'
                ]);
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

    static async getSchedule(id) {
        const result = await db.query(`
            SELECT b.id_barbero, b.id_usuario,
                   COALESCE(to_char(b.hora_inicio, 'HH24:MI'), '09:00') as hora_inicio,
                   COALESCE(to_char(b.hora_fin, 'HH24:MI'), '21:00') as hora_fin,
                   b.dias_laborales,
                   b.bloqueos
            FROM Barberos b
            WHERE b.id_barbero = $1 OR b.id_usuario = $1
            LIMIT 1
        `, [id]);

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        let schedules = row.dias_laborales;
        if (typeof schedules === 'string') {
            try { schedules = JSON.parse(schedules); } catch (e) { schedules = []; }
        }
        if (!Array.isArray(schedules) || schedules.length === 0) {
            schedules = [
                { dayId: 1, dayName: 'Lunes', activo: true, hora_inicio: row.hora_inicio || '09:00', hora_fin: row.hora_fin || '21:00' },
                { dayId: 2, dayName: 'Martes', activo: true, hora_inicio: row.hora_inicio || '09:00', hora_fin: row.hora_fin || '21:00' },
                { dayId: 3, dayName: 'Miércoles', activo: true, hora_inicio: row.hora_inicio || '09:00', hora_fin: row.hora_fin || '21:00' },
                { dayId: 4, dayName: 'Jueves', activo: true, hora_inicio: row.hora_inicio || '09:00', hora_fin: row.hora_fin || '21:00' },
                { dayId: 5, dayName: 'Viernes', activo: true, hora_inicio: row.hora_inicio || '09:00', hora_fin: row.hora_fin || '21:00' },
                { dayId: 6, dayName: 'Sábado', activo: true, hora_inicio: row.hora_inicio || '08:00', hora_fin: row.hora_fin || '21:00' },
                { dayId: 0, dayName: 'Domingo', activo: false, hora_inicio: '09:00', hora_fin: '14:00' }
            ];
        }

        let timeBlocks = row.bloqueos;
        if (typeof timeBlocks === 'string') {
            try { timeBlocks = JSON.parse(timeBlocks); } catch (e) { timeBlocks = []; }
        }
        if (!Array.isArray(timeBlocks)) timeBlocks = [];

        const generalShift = {
            hora_inicio: row.hora_inicio || '09:00',
            hora_fin: row.hora_fin || '21:00'
        };

        return { schedules, timeBlocks, generalShift };
    }

    static async updateSchedule(id, data) {
        const { schedules, timeBlocks, generalShift } = data;
        const hora_inicio = (generalShift?.hora_inicio || '09:00').substring(0, 5);
        const hora_fin = (generalShift?.hora_fin || '21:00').substring(0, 5);
        const schedJson = typeof schedules === 'object' ? JSON.stringify(schedules) : '[]';
        const blocksJson = typeof timeBlocks === 'object' ? JSON.stringify(timeBlocks) : '[]';

        const numId = parseInt(id, 10);
        const result = await db.query(`
            UPDATE Barberos
            SET hora_inicio = $1::time,
                hora_fin = $2::time,
                dias_laborales = $3::jsonb,
                bloqueos = $4::jsonb
            WHERE id_barbero = $5 OR id_usuario = $5
            RETURNING id_barbero
        `, [hora_inicio, hora_fin, schedJson, blocksJson, numId]);

        if (result.rowCount === 0) {
            const insRes = await db.query(`
                INSERT INTO Barberos (id_usuario, estado, tipo_contrato, porcentaje_ganancia, hora_inicio, hora_fin, dias_laborales, bloqueos)
                VALUES ($1, 'Activo', 'porcentaje', 50.00, $2::time, $3::time, $4::jsonb, $5::jsonb)
                ON CONFLICT (id_usuario) DO UPDATE
                SET hora_inicio = EXCLUDED.hora_inicio,
                    hora_fin = EXCLUDED.hora_fin,
                    dias_laborales = EXCLUDED.dias_laborales,
                    bloqueos = EXCLUDED.bloqueos
                RETURNING id_barbero
            `, [numId, hora_inicio, hora_fin, schedJson, blocksJson]);
            return insRes.rowCount > 0;
        }

        return result.rowCount > 0;
    }

    static async toggleStatus(id, estado) {
        const result = await db.query('UPDATE Barberos SET estado = $1 WHERE id_barbero = $2', [estado, id]);
        return result.rowCount > 0;
    }
}

module.exports = EmployeeModel;
