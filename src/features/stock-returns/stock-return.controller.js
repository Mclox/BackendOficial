// Corrección: Importamos el modelo en singular
const StockReturnModel = require('./stock-return.model');
const NotificationService = require('../notifications/notification.service');

class StockReturnController {
    static async getReturns(req, res) {
        try {
            const data = await StockReturnModel.getAll();
            res.json({ success: true, data });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async createReturn(req, res) {
        try {
            const { id_venta, motivo, detalles } = req.body;
            const id_usuario = req.user.id; // Del token JWT

            if (!detalles || detalles.length === 0) {
                return res.status(400).json({ success: false, message: "No hay productos para devolver" });
            }

            // Insertamos cada producto devuelto
            for (const det of detalles) {
                if (det.cantidad_devolver > 0) {
                    await StockReturnModel.create({
                        id_venta,
                        id_producto: det.id_producto,
                        id_usuario,
                        cantidad: det.cantidad_devolver,
                        motivo
                    });
                }
            }

            await NotificationService.createNotification({
                modulo: 'Devoluciones',
                accion: 'creacion',
                descripcion: `Se registró una devolución para la venta ID ${id_venta}.`,
                req
            });

            res.status(201).json({ success: true, message: "Devolución registrada y stock actualizado" });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async updateReturnStatus(req, res) {
        try {
            const { estado } = req.body;
            if (!estado) {
                return res.status(400).json({ success: false, message: "El estado es requerido" });
            }
            const updated = await StockReturnModel.updateStatus(req.params.id, estado);
            if (!updated) {
                return res.status(404).json({ success: false, message: "Devolución no encontrada" });
            }
            await NotificationService.createNotification({
                modulo: 'Devoluciones',
                accion: 'cambio_estado',
                descripcion: `Se cambió el estado de la devolución con ID ${req.params.id} a "${estado}".`,
                req
            });
            res.json({ success: true, message: "Estado de devolución actualizado" });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }
}
module.exports = StockReturnController;