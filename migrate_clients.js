const { sql, poolPromise } = require('./src/config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        
        console.log("Adding column 'tipo_documento' to table 'Clientes' if it doesn't exist...");
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Clientes' AND COLUMN_NAME = 'tipo_documento'
            )
            BEGIN
                ALTER TABLE Clientes ADD tipo_documento VARCHAR(20) NULL;
            END
        `);
        
        console.log("Adding column 'documento' to table 'Clientes' if it doesn't exist...");
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Clientes' AND COLUMN_NAME = 'documento'
            )
            BEGIN
                ALTER TABLE Clientes ADD documento VARCHAR(50) NULL;
            END
        `);

        console.log("Adding column 'recordatorio_enviado' to table 'Citas' if it doesn't exist...");
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Citas' AND COLUMN_NAME = 'recordatorio_enviado'
            )
            BEGIN
                ALTER TABLE Citas ADD recordatorio_enviado BIT DEFAULT 0;
            END
        `);
        
        // Asignar 0 por defecto a las citas existentes sin valor
        await pool.request().query(`
            UPDATE Citas SET recordatorio_enviado = 0 WHERE recordatorio_enviado IS NULL;
        `);

        console.log("Migration successful!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}
migrate();
