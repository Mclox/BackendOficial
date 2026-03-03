const express = require('express');
const router = express.Router();
const ProductController = require('./product.controller');
const { validateRequiredFields } = require('../../middlewares/validator');
const { verifyToken } = require('../../middlewares/auth.middleware');

// Protegemos todas las rutas con verifyToken
router.get('/', verifyToken, ProductController.getProducts);
router.get('/:id', verifyToken, ProductController.getProduct);
// 'nombre' y 'precio' son obligatorios según tu diccionario
router.post('/', verifyToken, validateRequiredFields(['nombre', 'precio']), ProductController.createProduct);
router.put('/:id', verifyToken, validateRequiredFields(['nombre', 'precio']), ProductController.updateProduct);
router.delete('/:id', verifyToken, ProductController.deleteProduct);

module.exports = router;