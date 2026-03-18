const express = require('express');
const router = express.Router();
// Corrección: Importamos el archivo en singular
const StockReturnController = require('./stock-return.controller'); 
const { verifyToken } = require('../../middlewares/auth.middleware');

router.get('/', verifyToken, StockReturnController.getReturns);
router.post('/', verifyToken, StockReturnController.createReturn);

module.exports = router;