const ProductEntryModel = require('./product-entries.model');

const getEntries = async (req, res) => {
    try {
        const entries = await ProductEntryModel.getAll();
        res.json({ success: true, data: entries });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createEntry = async (req, res) => {
    console.log("Usuario desde token:", req.user); // <--- AGREGA ESTO
    try {
        const { id_producto, cantidad, observaciones } = req.body;
        // El id_usuario viene inyectado del token JWT por el middleware de autenticación
        // Por esto (que coincide con el objeto 'id' que viene del JWT):
        const id_usuario = req.user.id;

        if (!id_producto || !cantidad || cantidad <= 0) {
            return res.status(400).json({ success: false, message: 'Datos incompletos o inválidos' });
        }

        const newEntry = await ProductEntryModel.create({ id_producto, id_usuario, cantidad, observaciones });
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

        const annulledEntry = await ProductEntryModel.annul(id, motivo_anulacion);
        
        if (!annulledEntry) {
            return res.status(404).json({ success: false, message: 'Entrada no encontrada o ya está anulada' });
        }

        res.json({ success: true, data: annulledEntry, message: 'Entrada anulada y stock revertido' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getEntries, createEntry, annulEntry };