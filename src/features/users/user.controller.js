const UserModel = require('./user.model');
const bcrypt = require('bcryptjs');

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
            if (userData.password) {
                const salt = await bcrypt.genSalt(10);
                userData.contrasena = await bcrypt.hash(userData.password, salt);
            }
            const newId = await UserModel.create(userData);
            res.status(201).json({ success: true, id_usuario: newId });
        } catch (error) { res.status(500).json({ success: false, message: error.message }); }
    }
}
module.exports = UserController;