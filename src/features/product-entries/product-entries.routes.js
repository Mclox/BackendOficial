const express = require('express');
const router = express.Router();
const { getEntries, createEntry, annulEntry } = require('./product-entries.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

// Rutas protegidas con verifyToken
router.get('/', verifyToken, getEntries);
router.post('/', verifyToken, createEntry);
router.put('/:id/annul', verifyToken, annulEntry); // Única ruta permitida para modificar

module.exports = router;