const express = require('express');
const router = express.Router();
const SuppReturnController = require('./supp-return.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.get('/', verifyToken, SuppReturnController.getReturns);
router.post('/', verifyToken, SuppReturnController.createReturn);

module.exports = router;