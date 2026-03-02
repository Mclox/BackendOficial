const StockReturnModel = require('./stock-return.model');

class StockReturnController {
    static async getReturns(req, res) {
        try {
            const returns = await StockReturnModel.getAll();
            res.json({ success: true, data: returns });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error obteniendo devoluciones', error: error.message });
        }
    }

    static async createReturn(req, res) {
        try {
            const newId = await StockReturnModel.create(req.body);
            res.status(201).json({ success: true, message: 'Devolución registrada', data: { id_devolucion: newId } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error registrando devolución', error: error.message });
        }
    }
}
module.exports = StockReturnController;