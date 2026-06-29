const { sql, poolPromise } = require('./src/config/db');

async function check() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT DISTINCT estado FROM Citas");
        console.log("Distinct states in DB:");
        console.log(res.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
