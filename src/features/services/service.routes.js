const express = require('express');
const router = express.Router();
const ServiceController = require('./service.controller');
const { validateRequiredFields } = require('../../middlewares/validator');
const { verifyToken, checkPermission } = require('../../middlewares/auth.middleware');

// Endpoint público para la landing page (sin token)
router.get('/public', ServiceController.getServices);

router.get('/', verifyToken, checkPermission('Servicios', 'leer'), ServiceController.getServices);
router.get('/:id', verifyToken, checkPermission('Servicios', 'leer'), ServiceController.getService);
router.post('/', verifyToken, checkPermission('Servicios', 'crear'), validateRequiredFields(['nombre', 'precio_neto']), ServiceController.createService);
router.put('/:id', verifyToken, checkPermission('Servicios', 'actualizar'), validateRequiredFields(['nombre', 'precio_neto']), ServiceController.updateService);
router.delete('/:id', verifyToken, checkPermission('Servicios', 'eliminar'), ServiceController.deleteService);

module.exports = router;