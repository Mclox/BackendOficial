const { sql, poolPromise } = require('../../config/db');

class EmployeeModel {
    static async getAll() {
        const pool = await poolPromise;
        // Hacemos un JOIN entre Barberos y Usuarios para traer toda la info junta
        const result = await pool.request().query(`
            SELECT b.id_barbero as id_empleado, b.id_usuario, b.estado, b.tipo_contrato as tipo_esquema, 
                   b.porcentaje_ganancia as porcentaje_comision, b.hora_inicio, b.hora_fin,
                   u.nombre, u.email, u.telefono, 'Barbero' as cargo, '' as apellido
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
        const { nombre, apellido, email, telefono, tipo_esquema, porcentaje_comision } = data;
        
        // Unimos nombre y apellido para la tabla Usuarios
        const nombreCompleto = apellido ? `${nombre} ${apellido}` : nombre;
        // Documento temporal (obligatorio en tu BD V2)
        const docTemp = 'BARB-' + Date.now();

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
                .input('doc', sql.VarChar, docTemp)
                .query(`
                    DECLARE @newUserId INT = (SELECT ISNULL(MAX(id_usuario), 0) + 1 FROM Usuarios);
                    INSERT INTO Usuarios (id_usuario, id_rol, nombre, tipo_documento, documento, email, telefono, contrasena)
                    VALUES (@newUserId, 2, @nom, 'CC', @doc, @eml, @tel, 'barbero123');
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
        const { tipo_esquema, porcentaje_comision } = data;
        
        // Por simplicidad, este UPDATE solo actualizará la info contractual en la tabla Barberos.
        // Si necesitas actualizar el nombre/email, deberías hacer un JOIN o actualizar la tabla Usuarios aparte.
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('tipo', sql.VarChar, tipo_esquema)
            .input('porc', sql.Decimal(5,2), porcentaje_comision || null)
            .query(`
                UPDATE Barberos 
                SET tipo_contrato = @tipo, porcentaje_ganancia = @porc
                WHERE id_barbero = @id
            `);
        return result.rowsAffected[0] > 0;
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