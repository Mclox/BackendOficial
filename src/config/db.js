// // // src/config/db.js
// // const sql = require('mssql');
// // require('dotenv').config();

// // const dbSettings = {
// //     user: process.env.DB_USER,
// //     password: process.env.DB_PASSWORD,
// //     server: process.env.DB_SERVER, 
// //     database: process.env.DB_NAME, 
// //     options: {
// //         encrypt: true, // Ponlo en false si te da error de certificado local
// //         trustServerCertificate: true 
// //     },
// //     pool: {
// //         max: 10,
// //         min: 0,
// //         idleTimeoutMillis: 30000
// //     }
// // };

// // const poolPromise = new sql.ConnectionPool(dbSettings)
// //     .connect()
// //     .then(pool => {
// //         console.log('✅ Conectado a SQL Server (BARBERSITE_V2)');
// //         return pool;
// //     })
// //     .catch(err => {
// //         console.error('❌ Error conectando a la base de datos:', err.message);
// //         process.exit(1);
// //     });

// // module.exports = { sql, poolPromise };

// // src/config/db.js
// const sql = require('mssql');
// require('dotenv').config();

// const dbSettings = {
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     server: process.env.DB_SERVER, 
//     database: process.env.DB_NAME, 
//     options: {
//         encrypt: true, 
//         trustServerCertificate: true 
//     },
//     pool: {
//         max: 10,
//         min: 0,
//         idleTimeoutMillis: 30000
//     }
// };

// let poolPromise;

// function connectDatabase() {
//     poolPromise = new sql.ConnectionPool(dbSettings)
//         .connect()
//         .then(pool => {
//             console.log('✅ Conectado exitosamente a SQL Server en la Nube (SmarterASP)');
            
//             // Manejar errores internos del pool una vez conectado (como caídas de red o ECONNRESET)
//             pool.on('error', err => {
//                 console.error('⚠️ Error en el pool de conexiones:', err.message);
//                 if (err.code === 'ECONNRESET' || err.message.includes('lost')) {
//                     console.log('🔄 Reintentando conectar a la base de datos...');
//                     connectDatabase();
//                 }
//             });

//             return pool;
//         })
//         .catch(err => {
//             console.error('❌ Error conectando a la base de datos:', err.message);
//             console.log('🔄 Reintentando conexión en 5 segundos...');
//             setTimeout(connectDatabase, 5000); // Reintenta en 5 segundos en vez de tumbar el servidor
//         });
// }

// // Inicializar la primera conexión
// connectDatabase();

// module.exports = { 
//     sql, 
//     getPool: () => poolPromise 
// };

const sql = require('mssql');
require('dotenv').config();

const dbSettings = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, 
    database: process.env.DB_NAME, 
    options: {
        encrypt: false, // Lo dejamos en false para evitar dolores de cabeza con certificados locales en Windows
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