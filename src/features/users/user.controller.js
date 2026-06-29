const UserModel = require('./user.model');
const NotificationService = require('../notifications/notification.service');

class UserController {
    static async getUsers(req, res) {
        try {
            const users = await UserModel.getAll();
            res.status(200).json({ success: true, data: users });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error obteniendo usuarios', error: error.message });
        }
    }

    static async getUser(req, res) {
        try {
            const user = await UserModel.getById(req.params.id);
            if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            res.status(200).json({ success: true, data: user });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error obteniendo usuario', error: error.message });
        }
    }

    static async createUser(req, res) {
        try {
            const userData = { ...req.body, contrasena: req.body.password };
            const newId = await UserModel.create(userData);
            await NotificationService.createNotification({
                modulo: 'Usuarios',
                accion: 'creacion',
                descripcion: `Se creó el usuario "${userData.nombre}" con correo "${userData.email}".`,
                req
            });
            res.status(201).json({ success: true, message: 'Usuario creado', data: { id_usuario: newId } });
        } catch (error) {
            if (error.number === 2627) return res.status(400).json({ success: false, message: 'El documento ya existe' });
            res.status(500).json({ success: false, message: 'Error creando usuario', error: error.message });
        }
    }

    static async updateUser(req, res) {
        try {
            const updated = await UserModel.update(req.params.id, req.body);
            if (!updated) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            await NotificationService.createNotification({
                modulo: 'Usuarios',
                accion: 'edicion',
                descripcion: `Se actualizó el usuario "${req.body.nombre || req.params.id}" (ID: ${req.params.id}).`,
                req
            });
            res.status(200).json({ success: true, message: 'Usuario actualizado' });
        } catch (error) {
            if (error.number === 2627) return res.status(400).json({ success: false, message: 'El documento ya pertenece a otro usuario' });
            res.status(500).json({ success: false, message: 'Error actualizando usuario', error: error.message });
        }
    }

    static async deleteUser(req, res) {
        try {
            const deleted = await UserModel.delete(req.params.id);
            if (!deleted) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            await NotificationService.createNotification({
                modulo: 'Usuarios',
                accion: 'eliminacion',
                descripcion: `Se eliminó el usuario con ID ${req.params.id}.`,
                req
            });
            res.status(200).json({ success: true, message: 'Usuario eliminado' });
        } catch (error) {
            if (error.number === 547) return res.status(400).json({ success: false, message: 'El usuario tiene registros asociados.' });
            res.status(500).json({ success: false, message: 'Error eliminando usuario', error: error.message });
        }
    }
}
module.exports = UserController;