const express = require('express');
const router = express.Router();
const ClientController = require('./client.controller');
const { validateRequiredFields } = require('../../middlewares/validator');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.get('/', verifyToken, ClientController.getClients);
router.get('/:id', verifyToken, ClientController.getClient);
// El diccionario dice que solo 'nombre' es NOT NULL
router.post('/', verifyToken, validateRequiredFields(['nombre']), ClientController.createClient);
router.put('/:id', verifyToken, validateRequiredFields(['nombre']), ClientController.updateClient);
router.delete('/:id', verifyToken, ClientController.deleteClient);

module.exports = router;