const express = require('express');
const router = express.Router();
const { getEntries, createEntry, annulEntry } = require('./product-entries.controller');
const { verifyToken, checkPermission } = require('../../middlewares/auth.middleware');

// Rutas protegidas con verifyToken y checkPermission
router.get('/', verifyToken, checkPermission('Productos', 'leer'), getEntries);
router.post('/', verifyToken, checkPermission('Productos', 'crear'), createEntry);
router.put('/:id/annul', verifyToken, checkPermission('Productos', 'actualizar'), annulEntry); // Única ruta permitida para modificar

module.exports = router;