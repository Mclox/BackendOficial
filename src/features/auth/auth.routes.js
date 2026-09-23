const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

// Rutas de autenticación
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/profile', verifyToken, AuthController.getProfile);

module.exports = router;