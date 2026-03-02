const ServiceModel = require('./service.model');

class ServiceController {
    static async getServices(req, res) {
        try {
            const services = await ServiceModel.getAll();
            res.json({ success: true, data: services });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error obteniendo servicios', error: error.message });
        }
    }

    static async getService(req, res) {
        try {
            const service = await ServiceModel.getById(req.params.id);
            if (!service) return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
            res.json({ success: true, data: service });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error obteniendo servicio', error: error.message });
        }
    }

    static async createService(req, res) {
        try {
            const newId = await ServiceModel.create(req.body);
            res.status(201).json({ success: true, message: 'Servicio creado', data: { id_servicio: newId } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error creando servicio', error: error.message });
        }
    }

    static async updateService(req, res) {
        try {
            const updated = await ServiceModel.update(req.params.id, req.body);
            if (!updated) return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
            res.json({ success: true, message: 'Servicio actualizado' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error actualizando servicio', error: error.message });
        }
    }

    static async deleteService(req, res) {
        try {
            const deleted = await ServiceModel.delete(req.params.id);
            if (!deleted) return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
            res.json({ success: true, message: 'Servicio eliminado' });
        } catch (error) {
            if (error.number === 547) return res.status(400).json({ success: false, message: 'No se puede eliminar, tiene citas o ventas asociadas.' });
            res.status(500).json({ success: false, message: 'Error eliminando servicio', error: error.message });
        }
    }
}
module.exports = ServiceController;