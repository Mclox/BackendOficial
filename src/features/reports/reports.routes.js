const express = require('express');
const router = express.Router();
const ReportsController = require('./reports.controller');
const { verifyToken, checkPermission } = require('../../middlewares/auth.middleware');

router.get('/appointments', verifyToken, checkPermission('Citas', 'leer'), ReportsController.getAppointments);
router.get('/income', verifyToken, checkPermission('Ventas', 'leer'), ReportsController.getIncome);
router.get('/products', verifyToken, checkPermission('Productos', 'leer'), ReportsController.getProducts);
router.get('/services', verifyToken, checkPermission('Servicios', 'leer'), ReportsController.getServices);
router.get('/employees', verifyToken, checkPermission('Empleados', 'leer'), ReportsController.getEmployees);

module.exports = router;