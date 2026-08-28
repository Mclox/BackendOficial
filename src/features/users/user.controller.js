const NotificationService = require('../notifications/notification.service');
const supabase = require('../../config/supabase');
const path = require('path');
const UserModel = require('./user.model');
const bcrypt = require('bcryptjs');
const db = require('../../config/db');


async function uploadBase64ToSupabase(base64Str) {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Formato Base64 inválido');
    }
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = mimeType.split('/')[1] || 'jpg';
    const filename = `${uniqueSuffix}.${extension}`;

    const { data, error } = await supabase.storage
        .from('products')
        .upload(filename, buffer, {
            contentType: mimeType,
            upsert: true
        });

    if (error) {
        throw new Error('Error subiendo imagen Base64 a Supabase: ' + error.message);
    }
    return `/uploads/products/${filename}`;
}

class UserController {
    static async getUsers(req, res) {
        try {
            const users = await UserModel.getAll();
            res.json({ success: true, data: users });
        } catch (error) { res.status(500).json({ success: false, message: error.message }); }
    }

    static async createUser(req, res) {
        try {
            const userData = { ...req.body };

            // 1. Validar obligatoriedad
            if (!userData.telefono || userData.telefono.trim() === '') {
                return res.status(400).json({ success: false, message: 'El número de teléfono es obligatorio.' });
            }

            // 2. Validar formato internacional (E.164)
            const cleanPhone = userData.telefono.trim().replace(/[^\d+]/g, '');
            const phoneRegex = /^\+[1-9]\d{9,14}$/;
            if (!phoneRegex.test(cleanPhone)) {
                return res.status(400).json({ success: false, message: 'El número de teléfono debe estar en formato internacional, iniciando con + (ej: +573001234567).' });
            }

            // 3. Evitar duplicación de teléfono
            const phoneCheck = await db.query('SELECT id_usuario FROM Usuarios WHERE telefono = $1', [cleanPhone]);
            if (phoneCheck.rows.length > 0) {
                return res.status(400).json({ success: false, message: 'El número de teléfono ya está registrado por otro usuario.' });
            }

            userData.telefono = cleanPhone;

            if (userData.password) {
                const salt = await bcrypt.genSalt(10);
                userData.contrasena = await bcrypt.hash(userData.password, salt);
            }
            const newId = await UserModel.create(userData);
            res.status(201).json({ success: true, id_usuario: newId });
        } catch (error) { res.status(500).json({ success: false, message: error.message }); }
    }

    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const userData = { ...req.body };

            // 1. Validar obligatoriedad del teléfono
            if (!userData.telefono || userData.telefono.trim() === '') {
                return res.status(400).json({ success: false, message: 'El número de teléfono es obligatorio.' });
            }

            // 2. Validar formato internacional (E.164)
            const cleanPhone = userData.telefono.trim().replace(/[^\d+]/g, '');
            const phoneRegex = /^\+[1-9]\d{9,14}$/;
            if (!phoneRegex.test(cleanPhone)) {
                return res.status(400).json({ success: false, message: 'El número de teléfono debe estar en formato internacional, iniciando con + (ej: +573001234567).' });
            }

            // 3. Evitar duplicación de teléfono excluyendo al usuario actual
            const phoneCheck = await db.query('SELECT id_usuario FROM Usuarios WHERE telefono = $1 AND id_usuario != $2', [cleanPhone, id]);
            if (phoneCheck.rows.length > 0) {
                return res.status(400).json({ success: false, message: 'El número de teléfono ya está registrado por otro usuario.' });
            }

            userData.telefono = cleanPhone;
            
            let contrasenaHash = null;
            if (userData.password && userData.password.trim() !== '') {
                const salt = await bcrypt.genSalt(10);
                contrasenaHash = await bcrypt.hash(userData.password, salt);
            }
            delete userData.password;

            
            // Log de depuración en la tabla de Notificaciones
            try {
                await NotificationService.createNotification({
                    modulo: 'Usuarios',
                    accion: 'edicion',
                    descripcion: `DEPURACION: Actualizando usuario ID ${id}. avatar en body: ${!!req.body.avatar}. img final: ${userData.img}. body keys: ${Object.keys(req.body).join(', ')}`,
                    req
                });
            } catch (notifyErr) {
                console.error('Error al crear notificación de depuración:', notifyErr);
            }
  
            const success = await UserModel.update(id, userData);
            if (success) {
                if (contrasenaHash) {
                    await db.query('UPDATE Usuarios SET contrasena = $1 WHERE id_usuario = $2', [contrasenaHash, id]);
                }
                // Si el rol es Cliente (ID 3), asegurar que exista registro en la tabla Clientes
                if (parseInt(userData.id_rol) === 3) {
                    const ClientModel = require('../clients/client.model');
                    await ClientModel.getOrCreateByUsuario(id);
                }
                res.json({ success: true, message: 'Usuario actualizado correctamente' });
            } else {
                res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const success = await UserModel.delete(id);
            if (success) {
                res.json({ success: true, message: 'Usuario eliminado correctamente' });
            } else {
                res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
module.exports = UserController;