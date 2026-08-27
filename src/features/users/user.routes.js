const express = require('express');
const router = express.Router();
const UserController = require('./user.controller');
const upload = require('../../middlewares/upload.middleware');

router.get('/', UserController.getUsers);
router.post('/', UserController.createUser);
router.put('/:id', upload.single('imagen'), UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

module.exports = router;