const { sql, poolPromise } = require('./src/config/db');

async function inspect() {
    try {
        const pool = await poolPromise;
        
        console.log("--- Servicios columns ---");
        const resServicios = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Servicios'");
        console.log(JSON.stringify(resServicios.recordset, null, 2));

        console.log("--- Clientes columns ---");
        const resClientes = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Clientes'");
        console.log(JSON.stringify(resClientes.recordset, null, 2));

        console.log("--- Clientes data sample ---");
        const resClientesData = await pool.request().query("SELECT TOP 5 * FROM Clientes");
        console.log(JSON.stringify(resClientesData.recordset, null, 2));

        console.log("--- Usuarios columns ---");
        const resUsuarios = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Usuarios'");
        console.log(JSON.stringify(resUsuarios.recordset, null, 2));

        console.log("--- Usuarios data sample ---");
        const resUsuariosData = await pool.request().query("SELECT TOP 5 id_usuario, nombre, estado FROM Usuarios");
        console.log(JSON.stringify(resUsuariosData.recordset, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
inspect();
