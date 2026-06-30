const express = require('express');
const router = express.Router();
const AuthController = require('./auth.controller');

// Rutas de autenticación
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);

module.exports = router;