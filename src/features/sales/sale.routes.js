const express = require('express');
const router = express.Router();
const SaleController = require('./sale.controller');
const { verifyToken, checkPermission } = require('../../middlewares/auth.middleware');

router.get('/', verifyToken, checkPermission('Ventas', 'leer'), SaleController.getSales);
router.get('/:id/details', verifyToken, checkPermission('Ventas', 'leer'), SaleController.getSaleDetails); // <--- NUEVA RUTA
router.post('/', verifyToken, checkPermission('Ventas', 'crear'), SaleController.createSale);

module.exports = router;