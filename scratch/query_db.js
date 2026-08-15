const db = require('../src/config/db');

async function checkDb() {
    try {
        console.log("Querying Distinct States...");
        const states = await db.query("SELECT DISTINCT estado FROM Citas");
        console.log("Distinct states:", states.rows);

        process.exit(0);
    } catch (e) {
        console.error("Error querying DB:", e);
        process.exit(1);
    }
}

checkDb();
