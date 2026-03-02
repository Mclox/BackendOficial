const express = require('express');
const router = express.Router();
const StockReturnController = require('./stock-return.controller');
const { validateRequiredFields } = require('../../middlewares/validator');

router.get('/', StockReturnController.getReturns);
router.post('/', validateRequiredFields(['remitido']), StockReturnController.createReturn);

module.exports = router;