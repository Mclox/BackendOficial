const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../../config/db');

router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Roles');
        res.json({ success: true, data: result.recordset });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;