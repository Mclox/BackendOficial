const { sql, poolPromise } = require('./src/config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        
        console.log("Checking and adding column 'descripcion' to table 'Servicios'...");
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'Servicios' AND COLUMN_NAME = 'descripcion'
            )
            BEGIN
                ALTER TABLE Servicios ADD descripcion VARCHAR(500) NULL;
            END
        `);
        
        console.log("Updating existing services with some description placeholders if empty...");
        await pool.request().query(`
            UPDATE Servicios SET descripcion = 'Corte de cabello profesional adaptado a tu estilo.' WHERE nombre = 'Corte de cabello' AND (descripcion IS NULL OR descripcion = '');
            UPDATE Servicios SET descripcion = 'Servicio completo de corte de cabello y arreglo/perfilado de barba.' WHERE nombre = 'Corte + Barba' AND (descripcion IS NULL OR descripcion = '');
            UPDATE Servicios SET descripcion = 'Depilación y diseño de cejas para definir tu mirada.' WHERE nombre = 'cejas' AND (descripcion IS NULL OR descripcion = '');
            UPDATE Servicios SET descripcion = 'Mascarilla hidratante y exfoliante para limpieza facial profunda.' WHERE nombre = 'Mascarilla facial' AND (descripcion IS NULL OR descripcion = '');
            UPDATE Servicios SET descripcion = 'Afeitado clásico, perfilado con navaja y nutrición de barba.' WHERE nombre = 'Perfilado de barba' AND (descripcion IS NULL OR descripcion = '');
            UPDATE Servicios SET descripcion = 'Tintura premium para cabello y/o barba con cobertura completa de canas.' WHERE nombre = 'Tintura de Cabello / Barba' AND (descripcion IS NULL OR descripcion = '');
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
