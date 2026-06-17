const { sql, poolPromise } = require('./src/config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        
        console.log("Adding column 'estado' to table 'Servicios'...");
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Servicios' AND COLUMN_NAME = 'estado'
            )
            BEGIN
                ALTER TABLE Servicios ADD estado VARCHAR(20) DEFAULT 'Activo';
            END
        `);
        
        console.log("Updating existing services with 'Activo' status...");
        await pool.request().query(`
            UPDATE Servicios SET estado = 'Activo' WHERE estado IS NULL;
        `);

        console.log("Verification - Servicios columns:");
        const res = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Servicios'");
        console.log(JSON.stringify(res.recordset, null, 2));

        console.log("Migration successful!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}
migrate();
