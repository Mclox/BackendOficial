const express = require('express');
const router = express.Router();
const SupplierController = require('./supplier.controller');
const { validateRequiredFields } = require('../../middlewares/validator');

// Campos requeridos para crear/actualizar
const requiredFields = ['nombre', 'Documento']; 

router.get('/', SupplierController.getSuppliers);
router.get('/:id', SupplierController.getSupplier);
router.post('/', validateRequiredFields(requiredFields), SupplierController.createSupplier);
router.put('/:id', validateRequiredFields(requiredFields), SupplierController.updateSupplier);
router.delete('/:id', SupplierController.deleteSupplier);

module.exports = router;