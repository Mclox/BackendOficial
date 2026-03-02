const PurchaseModel = require('./purchase.model');

class PurchaseController {
    static async getPurchases(req, res) {
        try {
            const purchases = await PurchaseModel.getAll();
            res.json({ success: true, data: purchases });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error obteniendo compras', error: error.message });
        }
    }

    static async getPurchase(req, res) {
        try {
            const purchase = await PurchaseModel.getById(req.params.id);
            if (!purchase) return res.status(404).json({ success: false, message: 'Compra no encontrada' });
            res.json({ success: true, data: purchase });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error obteniendo detalles de compra', error: error.message });
        }
    }

    static async createPurchase(req, res) {
        try {
            const newId = await PurchaseModel.createHeader(req.body);
            // Nota: En una implementación completa aquí iterarías sobre req.body.detalles para insertar en Detalle_Compra
            res.status(201).json({ success: true, message: 'Compra registrada', data: { id_compra: newId } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error registrando compra', error: error.message });
        }
    }
}
module.exports = PurchaseController;