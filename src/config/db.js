// const sql = require('mssql');
// require('dotenv').config();

// const dbSettings = {
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     server: process.env.DB_SERVER, 
//     database: process.env.DB_NAME, 
//     options: {
//         encrypt: false, // Lo dejamos en false para evitar dolores de cabeza con certificados locales en Windows
//         trustServerCertificate: true 
//     },
//     pool: {
//         max: 10,
//         min: 0,
//         idleTimeoutMillis: 30000
//     }
// };

// const poolPromise = new sql.ConnectionPool(dbSettings)
//     .connect()
//     .then(pool => {
//         console.log('✅ Conectado a SQL Server (BARBERSITE_V2)');
//         return pool;
//     })
//     .catch(err => {
//         console.error('❌ Error conectando a la base de datos:', err.message);
//         process.exit(1);
//     });

// module.exports = { sql, poolPromise };

const { Pool } = require('pg');
require('dotenv').config();

const dbSettings = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_SERVER, 
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
      };

const pool = new Pool(dbSettings);

// Objeto sql vacío para que los archivos viejos no den error al importar
const sql = {
    Int: 'INT', VarChar: 'VARCHAR', Decimal: 'DECIMAL', 
    Date: 'DATE', NVarChar: 'TEXT', MAX: 'MAX'
};

const poolPromise = pool.connect()
    .then(client => {
        console.log('✅ Conectado a PostgreSQL (BARBERSITE_V2)');
        client.release();
        return pool;
    })
    .catch(err => {
        console.error('❌ Error conectando a PostgreSQL:', err.message);
        process.exit(1);
    });

module.exports = {
    query: (text, params) => pool.query(text, params),
    poolPromise,
    pool,
    sql
};