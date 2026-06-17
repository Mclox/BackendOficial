const { sql, poolPromise } = require('../../config/db');

class EmployeeModel {
    static async getAll() {
        const pool = await poolPromise;
        // Hacemos un JOIN entre Barberos y Usuarios para traer toda la info junta
        const result = await pool.request().query(`
            SELECT b.id_barbero as id_empleado, b.id_usuario, b.estado, b.tipo_contrato as tipo_esquema, 
                   b.porcentaje_ganancia as porcentaje_comision, b.hora_inicio, b.hora_fin,
                   u.nombre, u.email, u.telefono, u.direccion, 'Barbero' as cargo, '' as apellido,
                   u.tipo_documento, u.documento
            FROM Barberos b
            JOIN Usuarios u ON b.id_usuario = u.id_usuario
        `);
        return result.recordset;
    }

    // Para la creación, requerimos que el Frontend nos envíe los datos personales
    // y nosotros creamos el Usuario (Rol 2 = Barbero) y luego el registro de Barbero
    static async create(data) {
        const pool = await poolPromise;
        // Campos que envía tu form de React
        const { 
            primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, 
            tipo_documento, documento, email, telefono, direccion, contrasena,
            tipo_esquema, porcentaje_comision 
        } = data;
        
        // Concatenar nombres para la tabla Usuarios
        const nombreCompleto = [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido]
            .filter(Boolean)
            .map(s => s.trim())
            .join(' ');
            
        const docVal = documento || ('BARB-' + Date.now());
        const tipoDocVal = tipo_documento || 'CC';
        const passVal = contrasena || 'barbero123';

        // Usamos una transacción para que si falla una tabla, no se guarde la otra
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Crear el Usuario (Rol 2 = Barbero)
            const reqUser = new sql.Request(transaction);
            const userResult = await reqUser
                .input('nom', sql.VarChar, nombreCompleto)
                .input('eml', sql.VarChar, email || null)
                .input('tel', sql.VarChar, telefono || null)
                .input('doc', sql.VarChar, docVal)
                .input('tipo_doc', sql.VarChar, tipoDocVal)
                .input('pwd', sql.VarChar, passVal)
                .input('dir', sql.VarChar, direccion || null)
                .query(`
                    DECLARE @newUserId INT = (SELECT ISNULL(MAX(id_usuario), 0) + 1 FROM Usuarios);
                    INSERT INTO Usuarios (id_usuario, id_rol, nombre, tipo_documento, documento, email, telefono, contrasena, direccion, estado)
                    VALUES (@newUserId, 2, @nom, @tipo_doc, @doc, @eml, @tel, @pwd, @dir, 'Activo');
                    SELECT @newUserId AS userId;
                `);
            const newUserId = userResult.recordset[0].userId;

            // 2. Crear el Barbero
            const reqBarb = new sql.Request(transaction);
            const barbResult = await reqBarb
                .input('id_u', sql.Int, newUserId)
                .input('tipo', sql.VarChar, tipo_esquema || 'porcentaje')
                .input('porc', sql.Decimal(5,2), porcentaje_comision || null)
                .query(`
                    DECLARE @newBarbId INT = (SELECT ISNULL(MAX(id_barbero), 0) + 1 FROM Barberos);
                    INSERT INTO Barberos (id_barbero, id_usuario, estado, tipo_contrato, porcentaje_ganancia)
                    VALUES (@newBarbId, @id_u, 'Activo', @tipo, @porc);
                    SELECT @newBarbId AS barbId;
                `);

            await transaction.commit();
            return barbResult.recordset[0].barbId;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    static async update(id, data) {
        const pool = await poolPromise;
        const { 
            primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, 
            tipo_documento, documento, email, telefono, direccion, contrasena,
            tipo_esquema, porcentaje_comision 
        } = data;
        
        const nombreCompleto = [primer_nombre, segundo_nombre, primer_apellido, segundo_apellido]
            .filter(Boolean)
            .map(s => s.trim())
            .join(' ');

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Obtener id_usuario a partir del id_barbero
            const reqGetId = new sql.Request(transaction);
            const userResult = await reqGetId
                .input('id_barbero', sql.Int, id)
                .query("SELECT id_usuario FROM Barberos WHERE id_barbero = @id_barbero");
            
            if (userResult.recordset.length === 0) {
                throw new Error('Empleado no encontrado');
            }
            const id_usuario = userResult.recordset[0].id_usuario;

            // 2. Actualizar la tabla Usuarios
            const reqUser = new sql.Request(transaction);
            reqUser
                .input('id_u', sql.Int, id_usuario)
                .input('nom', sql.VarChar, nombreCompleto)
                .input('eml', sql.VarChar, email || null)
                .input('tel', sql.VarChar, telefono || null)
                .input('doc', sql.VarChar, documento || null)
                .input('tipo_doc', sql.VarChar, tipo_documento || null)
                .input('dir', sql.VarChar, direccion || null);
            
            let queryUser = `
                UPDATE Usuarios 
                SET nombre = @nom, email = @eml, telefono = @tel, documento = @doc, tipo_documento = @tipo_doc, direccion = @dir
            `;
            
            if (contrasena && contrasena.trim()) {
                reqUser.input('pwd', sql.VarChar, contrasena);
                queryUser += ", contrasena = @pwd";
            }
            
            queryUser += " WHERE id_usuario = @id_u";
            await reqUser.query(queryUser);

            // 3. Actualizar la tabla Barberos
            const reqBarb = new sql.Request(transaction);
            await reqBarb
                .input('id_b', sql.Int, id)
                .input('tipo', sql.VarChar, tipo_esquema)
                .input('porc', sql.Decimal(5,2), porcentaje_comision || null)
                .query(`
                    UPDATE Barberos 
                    SET tipo_contrato = @tipo, porcentaje_ganancia = @porc
                    WHERE id_barbero = @id_b
                `);

            await transaction.commit();
            return true;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    static async toggleStatus(id, estado) {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('est', sql.VarChar, estado)
            .query(`UPDATE Barberos SET estado = @est WHERE id_barbero = @id`);
        return result.rowsAffected[0] > 0;
    }
}
module.exports = EmployeeModel;