const RoleModel = require('./role.model');
const NotificationService = require('../notifications/notification.service');

class RoleController {
    static async getRoles(req, res) {
        try {
            const roles = await RoleModel.getAll();
            res.json({ success: true, data: roles });
        } catch (error) { res.status(500).json({ error: error.message }); }
    }

    static async createRole(req, res) {
        try {
            const id = await RoleModel.create(req.body);
            await NotificationService.createNotification({
                modulo: 'Roles',
                accion: 'creacion',
                descripcion: `Se creó el rol "${req.body.nombre}" con éxito.`,
                req
            });
            res.status(201).json({ success: true, message: 'Rol creado exitosamente', id_rol: id });
        } catch (error) {
            if (error.number === 2627) return res.status(400).json({ success: false, message: 'El nombre del rol ya existe' });
            res.status(500).json({ error: error.message });
        }
    }

    static async updateRole(req, res) {
        try {
            const updated = await RoleModel.update(req.params.id, req.body);
            if (!updated) return res.status(404).json({ success: false, message: 'Rol no encontrado' });
            await NotificationService.createNotification({
                modulo: 'Roles',
                accion: 'edicion',
                descripcion: `Se actualizó el rol "${req.body.nombre || req.params.id}" (ID: ${req.params.id}).`,
                req
            });
            res.json({ success: true, message: 'Rol actualizado' });
        } catch (error) {
            if (error.number === 2627) return res.status(400).json({ success: false, message: 'El nombre del rol ya existe' });
            res.status(500).json({ error: error.message });
        }
    }

    static async deleteRole(req, res) {
        try {
            const deleted = await RoleModel.delete(req.params.id);
            if (!deleted) return res.status(404).json({ success: false, message: 'Rol no encontrado' });
            await NotificationService.createNotification({
                modulo: 'Roles',
                accion: 'eliminacion',
                descripcion: `Se eliminó el rol con ID ${req.params.id}.`,
                req
            });
            res.json({ success: true, message: 'Rol eliminado' });
        } catch (error) {
            if (error.number === 547) return res.status(400).json({ success: false, message: 'No se puede eliminar, hay usuarios con este rol asignado.' });
            res.status(500).json({ error: error.message });
        }
    }
}
module.exports = RoleController;