const express = require('express');
const router = express.Router();
const UserController = require('./user.controller');
const { validateRequiredFields } = require('../../middlewares/validator');

const userRequiredFields = ['nombre', 'email', 'id_rol', 'documento', 'password'];

router.get('/', UserController.getUsers);
router.get('/:id', UserController.getUser);
router.post('/', validateRequiredFields(userRequiredFields), UserController.createUser);
router.put('/:id', validateRequiredFields(['nombre', 'email', 'id_rol', 'documento']), UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

module.exports = router;