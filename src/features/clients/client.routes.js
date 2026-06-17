const express = require('express');
const router = express.Router();
const ClientController = require('./client.controller');
const { verifyToken, checkPermission } = require('../../middlewares/auth.middleware');

router.get('/', verifyToken, checkPermission('Clientes', 'leer'), ClientController.getClients);
router.get('/:id', verifyToken, checkPermission('Clientes', 'leer'), ClientController.getClient);
router.post('/', verifyToken, checkPermission('Clientes', 'crear'), ClientController.createClient);
router.put('/:id', verifyToken, checkPermission('Clientes', 'actualizar'), ClientController.updateClient);
router.delete('/:id', verifyToken, checkPermission('Clientes', 'eliminar'), ClientController.deleteClient);

module.exports = router;