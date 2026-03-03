const SaleModel = require('./sale.model');

class SaleController {
    static async getSales(req, res) {
        try {
            const data = await SaleModel.getAll();
            res.json({ success: true, data });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async createSale(req, res) {
        try {
            const id = await SaleModel.create(req.body);
            res.status(201).json({ success: true, id_venta_prod: id });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }
}
module.exports = SaleController;