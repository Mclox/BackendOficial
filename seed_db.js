const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("❌ Error: No se encontró la variable DATABASE_URL en el archivo .env.");
        process.exit(1);
    }

    console.log("📡 Conectando a PostgreSQL en Render...");
    const client = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("📖 Leyendo database_schema.sql...");
        const schemaPath = path.join(__dirname, 'database_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("⚡ Creando tablas, índices y triggers en la nube (Render)...");
        await client.query(schemaSql);
        console.log("✅ ¡Éxito! Todas las tablas y triggers fueron creados correctamente en Render.");
    } catch (err) {
        console.error("❌ Error al ejecutar el script:", err.message);
    } finally {
        await client.end();
        console.log("🔌 Conexión cerrada.");
    }
}

run();
