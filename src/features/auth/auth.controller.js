const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sql, poolPromise } = require('../../config/db');

class AuthController {
    static async login(req, res) {
        const { email, password } = req.body;
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('email', sql.VarChar, email)
                .query('SELECT u.*, r.nombre as rol FROM Usuarios u JOIN Roles r ON u.id_rol = r.id_rol WHERE u.email = @email');

            const user = result.recordset[0];
            if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

            // En un sistema real usaríamos bcrypt.compare, aquí comparamos directo por ahora para que no te bloquees
            if (password !== user.contrasena) {
                return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
            }

            const token = jwt.sign(
                { id: user.id_usuario, rol: user.rol }, 
                'SECRET_KEY_BARBERSITE', 
                { expiresIn: '8h' }
            );

            res.json({ success: true, token, user: { nombre: user.nombre, rol: user.rol } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
module.exports = AuthController;