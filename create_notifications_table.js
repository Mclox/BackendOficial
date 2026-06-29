const { sql, poolPromise } = require('./src/config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        console.log("Checking and creating 'Notificaciones' table...");
        
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[Notificaciones]') AND type in (N'U'))
            BEGIN
                CREATE TABLE Notificaciones (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    modulo VARCHAR(100) NOT NULL,
                    accion VARCHAR(100) NOT NULL,
                    descripcion NVARCHAR(MAX) NOT NULL,
                    usuario_id INT NULL,
                    usuario_nombre VARCHAR(100) NULL,
                    leido BIT DEFAULT 0,
                    fecha_creacion DATETIME2 DEFAULT GETDATE()
                );
                PRINT 'Table Notificaciones created successfully.';
            END
            ELSE
            BEGIN
                PRINT 'Table Notificaciones already exists.';
            END
        `);
        
        console.log("Database table setup complete.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}
migrate();
