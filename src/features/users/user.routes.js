const express = require('express');
const router = express.Router();
const UserController = require('./user.controller');
const { validateRequiredFields } = require('../../middlewares/validator');

// Cambia la línea de requiredFields por esta:
const userRequiredFields = ['nombre', 'tipo_documento', 'email', 'id_rol', 'documento', 'password'];

router.get('/', UserController.getUsers);
router.get('/:id', UserController.getUser);
router.post('/', validateRequiredFields(userRequiredFields), UserController.createUser);
router.put('/:id', validateRequiredFields(['nombre', 'email', 'id_rol', 'documento']), UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

module.exports = router;