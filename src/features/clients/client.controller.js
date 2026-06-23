const ClientModel = require('./client.model');

class ClientController {
    static async getClients(req, res) {
        try {
            if (req.user && req.user.rol === 'Cliente') {
                await ClientModel.getOrCreateByUsuario(req.user.id);
            }
            const clients = await ClientModel.getAll();
            const filtered = (req.user && req.user.rol === 'Cliente')
                ? clients.filter(c => c.id_usuario === req.user.id)
                : clients;
            res.json({ success: true, data: filtered });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error obteniendo clientes', error: error.message });
        }
    }

    static async getClient(req, res) {
        try {
            const client = await ClientModel.getById(req.params.id);
            if (!client) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
            res.json({ success: true, data: client });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error obteniendo cliente', error: error.message });
        }
    }

    static async createClient(req, res) {
        try {
            const id = await ClientModel.create(req.body);
            res.status(201).json({ success: true, message: 'Cliente creado', data: { id_cliente: id } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error creando cliente', error: error.message });
        }
    }

    static async updateClient(req, res) {
        try {
            const updated = await ClientModel.update(req.params.id, req.body);
            if (!updated) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
            res.json({ success: true, message: 'Cliente actualizado' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error actualizando cliente', error: error.message });
        }
    }

    static async deleteClient(req, res) {
        try {
            const deleted = await ClientModel.delete(req.params.id);
            if (!deleted) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
            res.json({ success: true, message: 'Cliente eliminado' });
        } catch (error) {
            if (error.number === 547) return res.status(400).json({ success: false, message: 'No se puede eliminar, el cliente tiene Citas o Facturas asociadas.' });
            res.status(500).json({ success: false, message: 'Error eliminando cliente', error: error.message });
        }
    }
}
module.exports = ClientController;