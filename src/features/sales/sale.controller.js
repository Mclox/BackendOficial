const SaleModel = require('./sale.model');

class SaleController {
    static async getSales(req, res) {
        try {
            const data = await SaleModel.getAll();
            res.json({ success: true, data });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    // ... debajo de getSales()

    static async getSaleDetails(req, res) {
        try {
            const { id } = req.params;
            const data = await SaleModel.getDetails(id);
            res.json({ success: true, data });
        } catch (error) { 
            res.status(500).json({ success: false, error: error.message }); 
        }
    }

    static async createSale(req, res) {
        try {
            const { id_cliente, id_vendedor, metodo_pago, detalles } = req.body;
            
            // 1. Creamos la Venta (Cabecera). No enviamos totales porque el Trigger lo hará.
            const id_venta = await SaleModel.createHeader({ id_cliente, id_vendedor, metodo_pago });
            
            // 2. Insertamos los detalles uno por uno. El Trigger sumará y actualizará la cabecera y el stock.
            if (detalles && detalles.length > 0) {
                for (const det of detalles) {
                    await SaleModel.createDetail(id_venta, det);
                }
            }

            res.status(201).json({ success: true, message: "Venta registrada con éxito", id_venta });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }
}
module.exports = SaleController;