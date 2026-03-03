const SuppReturnModel = require('./supp-return.model');

class SuppReturnController {
    static async getReturns(req, res) {
        try {
            const data = await SuppReturnModel.getAll();
            res.json({ success: true, data });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async createReturn(req, res) {
        try {
            const id = await SuppReturnModel.create(req.body);
            res.status(201).json({ success: true, id_dev_prov: id });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }
}
module.exports = SuppReturnController;