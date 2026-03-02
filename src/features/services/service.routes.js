const express = require('express');
const router = express.Router();
const ServiceController = require('./service.controller');
const { validateRequiredFields } = require('../../middlewares/validator');

router.get('/', ServiceController.getServices);
router.get('/:id', ServiceController.getService);
router.post('/', validateRequiredFields(['nombre', 'precio']), ServiceController.createService);
router.put('/:id', validateRequiredFields(['nombre', 'precio']), ServiceController.updateService);
router.delete('/:id', ServiceController.deleteService);

module.exports = router;