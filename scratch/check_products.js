const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("❌ Error: No DATABASE_URL found");
        process.exit(1);
    }

    const client = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query("SELECT id_producto, nombre, img, stock, estado FROM Productos");
        console.log("=== PRODUCTOS EN BASE DE DATOS ===");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error("❌ Error querying database:", err.message);
    } finally {
        await client.end();
    }
}

run();
