const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');

router.post('/login', AuthController.login);
router.post('/register', AuthController.register); // <-- ¡Ruta agregada!
router.post('/forgot-password', AuthController.forgotPassword); // <-- AGREGAR ESTA LÍNEA

module.exports = router;