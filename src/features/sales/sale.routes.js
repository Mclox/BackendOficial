const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ success: true, message: 'Módulo en construcción (Por Sebastián) 🚧' });
});

module.exports = router;