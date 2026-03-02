const SupplierModel = require('./supplier.model');

class SupplierController {
    static async getSuppliers(req, res) {
        try {
            const suppliers = await SupplierModel.getAll();
            res.status(200).json({ success: true, data: suppliers });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error obteniendo proveedores', error: error.message });
        }
    }

    static async getSupplier(req, res) {
        try {
            const supplier = await SupplierModel.getById(req.params.id);
            if (!supplier) return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
            res.status(200).json({ success: true, data: supplier });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error obteniendo proveedor', error: error.message });
        }
    }

    static async createSupplier(req, res) {
        try {
            const newId = await SupplierModel.create(req.body);
            res.status(201).json({ success: true, message: 'Proveedor creado', data: { id_proveedor: newId } });
        } catch (error) {
            if (error.number === 2627) return res.status(400).json({ success: false, message: 'El Documento ya existe en otro proveedor' });
            res.status(500).json({ success: false, message: 'Error creando proveedor', error: error.message });
        }
    }

    static async updateSupplier(req, res) {
        try {
            const updated = await SupplierModel.update(req.params.id, req.body);
            if (!updated) return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
            res.status(200).json({ success: true, message: 'Proveedor actualizado' });
        } catch (error) {
            if (error.number === 2627) return res.status(400).json({ success: false, message: 'El Documento ya existe en otro proveedor' });
            res.status(500).json({ success: false, message: 'Error actualizando proveedor', error: error.message });
        }
    }

    static async deleteSupplier(req, res) {
        try {
            const deleted = await SupplierModel.delete(req.params.id);
            if (!deleted) return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
            res.status(200).json({ success: true, message: 'Proveedor eliminado' });
        } catch (error) {
            if (error.number === 547) return res.status(400).json({ success: false, message: 'No se puede eliminar, tiene registros asociados.' });
            res.status(500).json({ success: false, message: 'Error eliminando proveedor', error: error.message });
        }
    }
}
module.exports = SupplierController;