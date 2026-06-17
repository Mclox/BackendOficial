const express = require('express');
const router = express.Router();
const ProductController = require('./product.controller');
const { validateRequiredFields } = require('../../middlewares/validator');
const { verifyToken, checkPermission } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');

// Endpoint público para el catálogo de la landing page (sin token)
router.get('/public', ProductController.getProducts);

// Protegemos todas las demás rutas con verifyToken y checkPermission
router.get('/', verifyToken, checkPermission('Productos', 'leer'), ProductController.getProducts);
router.get('/:id', verifyToken, checkPermission('Productos', 'leer'), ProductController.getProduct);
// 'nombre' y 'precio_neto' son obligatorios según tu diccionario
router.post('/', verifyToken, checkPermission('Productos', 'crear'), upload.single('imagen'), validateRequiredFields(['nombre', 'precio_neto']), ProductController.createProduct);
router.put('/:id', verifyToken, checkPermission('Productos', 'actualizar'), upload.single('imagen'), validateRequiredFields(['nombre', 'precio_neto']), ProductController.updateProduct);
router.delete('/:id', verifyToken, checkPermission('Productos', 'eliminar'), ProductController.deleteProduct);

module.exports = router;