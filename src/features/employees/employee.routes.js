const express = require('express');
const router = express.Router();
const EmployeeController = require('./employee.controller');
const { verifyToken, checkPermission } = require('../../middlewares/auth.middleware');

// Endpoint público para la landing page (sin token)
router.get('/public', EmployeeController.getEmployees);

router.get('/', verifyToken, checkPermission('Empleados', 'leer'), EmployeeController.getEmployees);
router.post('/', verifyToken, checkPermission('Empleados', 'crear'), EmployeeController.createEmployee);
router.put('/:id', verifyToken, checkPermission('Empleados', 'actualizar'), EmployeeController.updateEmployee);
router.put('/:id/status', verifyToken, checkPermission('Empleados', 'actualizar'), EmployeeController.toggleStatus);

module.exports = router;