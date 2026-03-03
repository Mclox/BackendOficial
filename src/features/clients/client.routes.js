const express = require('express');
const router = express.Router();
const ClientController = require('./client.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.get('/', verifyToken, ClientController.getClients);
router.get('/:id', verifyToken, ClientController.getClient);
router.post('/', verifyToken, ClientController.createClient);
router.put('/:id', verifyToken, ClientController.updateClient);
router.delete('/:id', verifyToken, ClientController.deleteClient);

module.exports = router;