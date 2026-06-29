const { sql, poolPromise } = require('./src/config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        console.log("Checking and adding column 'recordatorio_30m_enviado' to table 'Citas'...");
        
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Citas' AND COLUMN_NAME = 'recordatorio_30m_enviado'
            )
            BEGIN
                ALTER TABLE Citas ADD recordatorio_30m_enviado BIT DEFAULT 0;
                PRINT 'Column recordatorio_30m_enviado added successfully.';
            END
            ELSE
            BEGIN
                PRINT 'Column recordatorio_30m_enviado already exists.';
            END
        `);
        
        // Also update existing rows to be 0 if they are NULL
        await pool.request().query(`
            UPDATE Citas SET recordatorio_30m_enviado = 0 WHERE recordatorio_30m_enviado IS NULL;
        `);
        console.log("Database table Citas update complete.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}
migrate();
