const express = require('express');
const router = express.Router();
const SaleController = require('./sale.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.get('/', verifyToken, SaleController.getSales);
router.get('/:id/details', verifyToken, SaleController.getSaleDetails); // <--- NUEVA RUTA
router.post('/', verifyToken, SaleController.createSale);

module.exports = router;