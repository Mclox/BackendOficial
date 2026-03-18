const express = require('express');
const router = express.Router();
const EmployeeController = require('./employee.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.get('/', verifyToken, EmployeeController.getEmployees);
router.post('/', verifyToken, EmployeeController.createEmployee);
router.put('/:id', verifyToken, EmployeeController.updateEmployee);
router.put('/:id/status', verifyToken, EmployeeController.toggleStatus);

module.exports = router;