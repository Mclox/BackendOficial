const ProductModel = require('./product.model');
const NotificationService = require('../notifications/notification.service');

class ProductController {
    static async getProducts(req, res) {
        try {
            const products = await ProductModel.getAll();
            res.json({ success: true, data: products });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error obteniendo productos', error: error.message });
        }
    }

    static async getProduct(req, res) {
        try {
            const product = await ProductModel.getById(req.params.id);
            if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            res.json({ success: true, data: product });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error obteniendo producto', error: error.message });
        }
    }

    static async createProduct(req, res) {
        try {
            const productData = { ...req.body };
            if (req.file) {
                productData.img = `/uploads/products/${req.file.filename}`;
            }
            const id = await ProductModel.create(productData);
            await NotificationService.createNotification({
                modulo: 'Productos',
                accion: 'creacion',
                descripcion: `Se creó el producto "${productData.nombre}" con stock de ${productData.stock || 0}.`,
                req
            });
            res.status(201).json({ success: true, message: 'Producto creado', data: { id_producto: id } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error creando producto', error: error.message });
        }
    }

    static async updateProduct(req, res) {
        try {
            const productData = { ...req.body };
            if (req.file) {
                productData.img = `/uploads/products/${req.file.filename}`;
            }
            const updated = await ProductModel.update(req.params.id, productData);
            if (!updated) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            await NotificationService.createNotification({
                modulo: 'Productos',
                accion: 'edicion',
                descripcion: `Se actualizó el producto "${productData.nombre}" (ID: ${req.params.id}).`,
                req
            });
            res.json({ success: true, message: 'Producto actualizado' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error actualizando producto', error: error.message });
        }
    }

    static async deleteProduct(req, res) {
        try {
            const deleted = await ProductModel.delete(req.params.id);
            if (!deleted) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            await NotificationService.createNotification({
                modulo: 'Productos',
                accion: 'eliminacion',
                descripcion: `Se eliminó el producto con ID ${req.params.id}.`,
                req
            });
            res.json({ success: true, message: 'Producto eliminado' });
        } catch (error) {
            if (error.code === '23503') return res.status(400).json({ success: false, message: 'No se puede eliminar, el producto tiene historial (ej. Ventas o Compras).' });
            res.status(500).json({ success: false, message: 'Error eliminando producto', error: error.message });
        }
    }
}

module.exports = ProductController;