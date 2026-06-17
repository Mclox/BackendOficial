const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.post('/login', AuthController.login);
router.post('/register', AuthController.register); // <-- ¡Ruta agregada!
router.post('/forgot-password', AuthController.forgotPassword); // <-- AGREGAR ESTA LÍNEA
router.post('/reset-password', AuthController.resetPassword); // <-- NUEVA RUTA
router.get('/profile', verifyToken, AuthController.getProfile); // <-- NUEVA RUTA PERFIL

module.exports = router;