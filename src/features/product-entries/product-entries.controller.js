const ProductEntryModel = require('./product-entries.model');
const NotificationService = require('../notifications/notification.service');

const getEntries = async (req, res) => {
    try {
        const entries = await ProductEntryModel.getAll();
        res.json({ success: true, data: entries });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createEntry = async (req, res) => {
    try {
        const { id_producto, cantidad, observaciones } = req.body;
        const id_usuario = req.user.id;

        if (!id_producto || !cantidad || cantidad <= 0) {
            return res.status(400).json({ success: false, message: 'Datos incompletos o inválidos' });
        }

        const newEntry = await ProductEntryModel.create({ id_producto, id_usuario, cantidad, observaciones });
        await NotificationService.createNotification({
            modulo: 'Entradas de Productos',
            accion: 'creacion',
            descripcion: `Se registró una entrada de ${cantidad} unidades para el producto ID ${id_producto}.`,
            req
        });
        res.status(201).json({ success: true, data: newEntry, message: 'Entrada registrada y stock actualizado' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const annulEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo_anulacion } = req.body;

        if (!motivo_anulacion) {
            return res.status(400).json({ success: false, message: 'El motivo de anulación es obligatorio' });
        }

        const annulnedEntry = await ProductEntryModel.annul(id, motivo_anulacion);
        
        if (!annulnedEntry) {
            return res.status(404).json({ success: false, message: 'Entrada no encontrada o ya está anulada' });
        }

        await NotificationService.createNotification({
            modulo: 'Entradas de Productos',
            accion: 'edicion',
            descripcion: `Se anuló la entrada de producto ID ${id} por motivo: "${motivo_anulacion}".`,
            req
        });

        res.json({ success: true, data: annulnedEntry, message: 'Entrada anulada y stock revertido' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getEntries, createEntry, annulEntry };