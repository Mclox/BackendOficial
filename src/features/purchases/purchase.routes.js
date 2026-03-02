const express = require('express');
const router = express.Router();
const PurchaseController = require('./purchase.controller');
const { validateRequiredFields } = require('../../middlewares/validator');

router.get('/', PurchaseController.getPurchases);
router.get('/:id', PurchaseController.getPurchase);
router.post('/', validateRequiredFields(['id_proveedor', 'total']), PurchaseController.createPurchase);

module.exports = router;