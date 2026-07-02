const express = require('express');
const router = express.Router();
const { getEntries, createEntry, annulEntry } = require('./product-entries.controller');
const { verifyToken, checkPermission } = require('../../middlewares/auth.middleware');

// Rutas protegidas con verifyToken y checkPermission
router.get('/', verifyToken, checkPermission('Entradas de Productos', 'leer'), getEntries);
router.post('/', verifyToken, checkPermission('Entradas de Productos', 'crear'), createEntry);
router.put('/:id/annul', verifyToken, checkPermission('Entradas de Productos', 'actualizar'), annulEntry); // Única ruta permitida para modificar

module.exports = router;