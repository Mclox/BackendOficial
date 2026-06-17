const express = require('express');
const router = express.Router();
const DashboardController = require('./dashboard.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.get('/', verifyToken, DashboardController.getDashboardData);

module.exports = router;