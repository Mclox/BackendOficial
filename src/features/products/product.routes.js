const express = require('express');
const router = express.Router();
const ProductController = require('./product.controller');

router.get('/', ProductController.getProducts);
router.post('/', ProductController.createProduct);

module.exports = router;