const ProductModel = require('./product.model');

class ProductController {
    static async getProducts(req, res) {
        try {
            const products = await ProductModel.getAll();
            res.json({ success: true, data: products });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async createProduct(req, res) {
        try {
            const id = await ProductModel.create(req.body);
            res.status(201).json({ success: true, id });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
module.exports = ProductController;