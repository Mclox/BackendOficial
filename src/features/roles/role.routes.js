const express = require('express');
const router = express.Router();
const RoleController = require('./role.controller');
const { validateRequiredFields } = require('../../middlewares/validator');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.get('/', verifyToken, RoleController.getRoles);
router.post('/', verifyToken, validateRequiredFields(['nombre']), RoleController.createRole);
router.put('/:id', verifyToken, validateRequiredFields(['nombre']), RoleController.updateRole);

module.exports = router;