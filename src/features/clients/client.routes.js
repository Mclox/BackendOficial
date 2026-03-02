const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../../config/db');
const ClientModel = require('./client.model');

router.get('/', async (req, res) => {
    const clients = await ClientModel.getAll();
    res.json({ success: true, data: clients });
});

router.post('/', async (req, res) => {
    try {
        const id = await ClientModel.create(req.body);
        res.json({ success: true, id });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;