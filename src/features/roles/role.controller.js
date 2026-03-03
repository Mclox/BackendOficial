const RoleModel = require('./role.model');

class RoleController {
    static async getRoles(req, res) {
        try {
            const roles = await RoleModel.getAll();
            res.json({ success: true, data: roles });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error obteniendo roles', error: error.message });
        }
    }

    static async createRole(req, res) {
        try {
            const id = await RoleModel.create(req.body);
            res.status(201).json({ success: true, message: 'Rol creado exitosamente', data: { id_rol: id } });
        } catch (error) {
            // Error 2627 es cuando viola una restricción UNIQUE (ej. el nombre del rol ya existe)
            if (error.number === 2627) {
                return res.status(400).json({ success: false, message: 'El nombre del rol ya existe' });
            }
            res.status(500).json({ success: false, message: 'Error creando rol', error: error.message });
        }
    }
}
module.exports = RoleController;