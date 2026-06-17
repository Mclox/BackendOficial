const express = require('express');
const router = express.Router();
const RoleController = require('./role.controller');
const { validateRequiredFields } = require('../../middlewares/validator');
const { verifyToken, checkPermission } = require('../../middlewares/auth.middleware');

router.get('/', verifyToken, checkPermission('Roles', 'leer'), RoleController.getRoles);
router.post('/', verifyToken, checkPermission('Roles', 'crear'), validateRequiredFields(['nombre']), RoleController.createRole);
router.put('/:id', verifyToken, checkPermission('Roles', 'actualizar'), validateRequiredFields(['nombre']), RoleController.updateRole);

module.exports = router;