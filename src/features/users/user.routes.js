const express = require('express');
const router = express.Router();
const UserController = require('./user.controller');
const { validateRequiredFields } = require('../../middlewares/validator');
const { verifyToken, checkPermission } = require('../../middlewares/auth.middleware');

// Cambia la línea de requiredFields por esta:
const userRequiredFields = ['nombre', 'tipo_documento', 'email', 'id_rol', 'documento', 'password'];

router.get('/', verifyToken, checkPermission('Usuarios', 'leer'), UserController.getUsers);
router.get('/:id', verifyToken, checkPermission('Usuarios', 'leer'), UserController.getUser);
router.post('/', verifyToken, checkPermission('Usuarios', 'crear'), validateRequiredFields(userRequiredFields), UserController.createUser);
router.put('/:id', verifyToken, checkPermission('Usuarios', 'actualizar'), validateRequiredFields(['nombre', 'email', 'id_rol', 'documento']), UserController.updateUser);
router.delete('/:id', verifyToken, checkPermission('Usuarios', 'eliminar'), UserController.deleteUser);

module.exports = router;