const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { sql, poolPromise } = require('../../config/db');
const UserModel = require('../users/user.model');

// Configuración del servicio de correo
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

class AuthController {
    // --- FUNCIÓN LOGIN (Mejorada para soportar Bcrypt sin romper lo anterior) ---
    static async login(req, res) {
        const { email, contrasena } = req.body;
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('email', sql.VarChar, email)
                .query(`SELECT u.*, r.nombre as rol_nombre, r.permisos as rol_permisos FROM Usuarios u JOIN Roles r ON u.id_rol = r.id_rol WHERE u.email = @email`);

            const user = result.recordset[0];
            if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

            // Lógica inteligente: Si la contraseña empieza con $2a$ o $2b$, es un Hash de Bcrypt. Si no, es texto plano (ej: admin123)
            let isMatch = false;
            if (user.contrasena.startsWith('$2a$') || user.contrasena.startsWith('$2b$')) {
                isMatch = await bcrypt.compare(contrasena, user.contrasena);
            } else {
                isMatch = (contrasena === user.contrasena);
            }

            if (!isMatch) return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });

            const token = jwt.sign(
                { id: user.id_usuario, rol: user.rol_nombre, email: user.email },
                process.env.JWT_SECRET || 'SECRET_KEY_BARBERSITE',
                { expiresIn: '8h' }
            );

            let permissions = [];
            try {
                permissions = user.rol_permisos ? JSON.parse(user.rol_permisos) : [];
            } catch (e) {
                console.error("Error parsing user permissions during login", e);
            }

            res.status(200).json({
                success: true, message: 'Login exitoso', token: token,
                user: {
                    id_usuario: user.id_usuario,
                    nombre: user.nombre,
                    email: user.email,
                    telefono: user.telefono,
                    direccion: user.direccion,
                    documento: user.documento,
                    rol: user.rol_nombre,
                    id_rol: user.id_rol,
                    img: user.img,
                    permisos: permissions
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
        }
    }

    // --- FUNCIÓN REGISTER (Se mantiene igual) ---
    static async register(req, res) {
        try {
            const { nombre, email, password, telefono } = req.body;
            const documentoGenerado = 'TEMP-' + Date.now();
            const userData = { id_rol: 3, nombre, tipo_documento: 'CC', documento: documentoGenerado, email, telefono: telefono || '', direccion: '', contrasena: password };
            const newId = await UserModel.create(userData);
            res.status(201).json({ success: true, message: 'Usuario registrado exitosamente', id_usuario: newId });
        } catch (error) {
            if (error.number === 2627) return res.status(400).json({ success: false, message: 'El correo electrónico ya está registrado.' });
            res.status(500).json({ success: false, message: 'Error registrando usuario', error: error.message });
        }
    }

    // --- 1. SOLICITAR RECUPERACIÓN (Envía el correo) ---
    static async forgotPassword(req, res) {
        const { email } = req.body;
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('email', sql.VarChar, email)
                .query('SELECT id_usuario, nombre, email, contrasena FROM Usuarios WHERE email = @email');

            const user = result.recordset[0];
            if (!user) {
                // Por seguridad, respondemos siempre con éxito aunque no exista, para no revelar correos registrados
                return res.json({ success: true, message: 'Si el correo existe, se han enviado las instrucciones.' });
            }

            // Crear un secreto único válido solo mientras no cambie su contraseña
            const secret = (process.env.JWT_SECRET || 'SECRET_KEY_BARBERSITE') + user.contrasena;

            // Generar Token que expira en 15 minutos
            const token = jwt.sign({ email: user.email, id: user.id_usuario }, secret, { expiresIn: '15m' });

            // Crear Link Seguro
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const resetLink = `${frontendUrl}/?token=${token}&email=${user.email}`;

            // Enviar Correo
            const mailOptions = {
                from: `"BarberSite V2" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: '💈 Recuperación de Contraseña - BarberSite',
                html: `
                    <h2>Hola ${user.nombre},</h2>
                    <p>Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva. Este enlace <b>caducará en 15 minutos</b>.</p>
                    <a href="${resetLink}" style="background-color: #D4AF37; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Restablecer Contraseña</a>
                    <p>Si no fuiste tú, ignora este correo.</p>
                `
            };

            await transporter.sendMail(mailOptions);

            res.json({ success: true, message: `Instrucciones enviadas al correo.` });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al enviar el correo', error: error.message });
        }
    }

    // --- 2. VALIDAR TOKEN Y CAMBIAR CONTRASEÑA (Bcrypt) ---
    static async resetPassword(req, res) {
        const { email, token, newPassword } = req.body;
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('email', sql.VarChar, email)
                .query('SELECT id_usuario, contrasena FROM Usuarios WHERE email = @email');

            const user = result.recordset[0];
            if (!user) return res.status(400).json({ success: false, message: 'Usuario inválido' });

            // Recrear el secreto para validar el token
            const secret = (process.env.JWT_SECRET || 'SECRET_KEY_BARBERSITE') + user.contrasena;

            try {
                jwt.verify(token, secret);
            } catch (error) {
                return res.status(400).json({ success: false, message: 'El enlace ha caducado o es inválido. Solicita uno nuevo.' });
            }

            // Encriptar la nueva contraseña con Bcrypt
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Guardar en la Base de Datos
            await pool.request()
                .input('email', sql.VarChar, email)
                .input('hash', sql.VarChar, hashedPassword)
                .query('UPDATE Usuarios SET contrasena = @hash WHERE email = @email');

            res.json({ success: true, message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al restablecer contraseña', error: error.message });
        }
    }

    // --- OBTENER PERFIL DE USUARIO LOGUEADO (Con permisos actualizados) ---
    static async getProfile(req, res) {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('id_usuario', req.user.id)
                .query(`
                    SELECT u.*, r.nombre as rol_nombre, r.permisos as rol_permisos 
                    FROM Usuarios u 
                    JOIN Roles r ON u.id_rol = r.id_rol 
                    WHERE u.id_usuario = @id_usuario
                `);

            const user = result.recordset[0];
            if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

            let permissions = [];
            try {
                permissions = user.rol_permisos ? JSON.parse(user.rol_permisos) : [];
            } catch (e) {
                console.error("Error parsing user permissions in profile", e);
            }

            res.status(200).json({
                success: true,
                user: {
                    id_usuario: user.id_usuario,
                    nombre: user.nombre,
                    email: user.email,
                    telefono: user.telefono,
                    direccion: user.direccion,
                    documento: user.documento,
                    rol: user.rol_nombre,
                    id_rol: user.id_rol,
                    img: user.img,
                    permisos: permissions
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
        }
    }
}

module.exports = AuthController;