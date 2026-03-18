// src/config/db.js
const sql = require('mssql');
require('dotenv').config();

const dbSettings = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, 
    database: process.env.DB_NAME, 
    options: {
        encrypt: true, // Ponlo en false si te da error de certificado local
        trustServerCertificate: true 
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const poolPromise = new sql.ConnectionPool(dbSettings)
    .connect()
    .then(pool => {
        console.log('✅ Conectado a SQL Server (BARBERSITE_V2)');
        return pool;
    })
    .catch(err => {
        console.error('❌ Error conectando a la base de datos:', err.message);
        process.exit(1);
    });

module.exports = { sql, poolPromise };