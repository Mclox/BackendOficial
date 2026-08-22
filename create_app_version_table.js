const db = require('./src/config/db');

async function run() {
    try {
        console.log("📡 Conectando a la base de datos para crear la tabla 'App_Version'...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS App_Version (
                id SERIAL PRIMARY KEY,
                version_name VARCHAR(50) NOT NULL,
                version_code INT UNIQUE NOT NULL,
                download_url TEXT NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
        `);
        console.log("✅ Tabla 'App_Version' creada o ya existente.");
        
        // Insertar versión semilla inicial si está vacía
        const check = await db.query("SELECT COUNT(*) FROM App_Version");
        if (parseInt(check.rows[0].count) === 0) {
            await db.query(`
                INSERT INTO App_Version (version_name, version_code, download_url)
                VALUES ($1, $2, $3)
            `, ['0.1.0', 1, 'https://drive.google.com/drive/folders/1eQ_d861gVdM0qf9V31g8-DNPp9sCsh4n']);
            console.log("🌱 Versión inicial sembrada (0.1.0+1).");
        } else {
            console.log("ℹ️ La tabla ya contiene registros de versión.");
        }
        process.exit(0);
    } catch (err) {
        console.error("❌ Error al crear e inicializar la tabla:", err);
        process.exit(1);
    }
}
run();
