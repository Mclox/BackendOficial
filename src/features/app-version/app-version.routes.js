const express = require('express');
const router = express.Router();
const AppVersionController = require('./app-version.controller');

// Obtener la última versión disponible para la app móvil
router.get('/latest', AppVersionController.getLatestVersion);

// Registrar o actualizar información de versión (usado por script de compilación)
router.post('/update', AppVersionController.updateVersion);

module.exports = router;
