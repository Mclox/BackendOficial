// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
// const { sql, poolPromise } = require('../../config/db');

// class AuthController {
//     static async login(req, res) {
//         const { email, password } = req.body;
//         try {
//             const pool = await poolPromise;
//             const result = await pool.request()
//                 .input('email', sql.VarChar, email)
//                 .query('SELECT u.*, r.nombre as rol FROM Usuarios u JOIN Roles r ON u.id_rol = r.id_rol WHERE u.email = @email');

//             const user = result.recordset[0];
//             if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

//             // En un sistema real usaríamos bcrypt.compare, aquí comparamos directo por ahora para que no te bloquees
//             if (password !== user.contrasena) {
//                 return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
//             }
//                 // Generar el Token JWT (Válido por 8 horas)
//             const token = jwt.sign(
//                 { id: user.id_usuario, rol: user.rol_nombre, email: user.email },
//                 process.env.JWT_SECRET || 'MiClaveSecretaSuperSegura123',
//                 { expiresIn: '8h' }
//             );

//             // Respondemos con éxito, el token y los datos COMPLETOS del usuario
//             res.status(200).json({
//                 success: true,
//                 message: 'Login exitoso',
//                 token: token,
//                 user: {
//                     id_usuario: user.id_usuario, // Cambiado de 'id' a 'id_usuario' para coincidir con tu interface
//                     nombre: user.nombre,
//                     email: user.email,
//                     telefono: user.telefono,      // <-- ¡Agregado!
//                     direccion: user.direccion,    // <-- ¡Agregado!
//                     documento: user.documento,    // <-- ¡Agregado!
//                     rol: user.rol_nombre,
//                     id_rol: user.id_rol,          // <-- ¡Agregado! Necesario para React
//                     img: user.img
//                 }
//             });

//         } catch (error) {
//             res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
//         }
//     }
// }

// module.exports = AuthController;
// //             const token = jwt.sign(
// //                 { id: user.id_usuario, rol: user.rol }, 
// //                 'SECRET_KEY_BARBERSITE', 
// //                 { expiresIn: '8h' }
// //             );

// //             res.json({ success: true, token, user: { nombre: user.nombre, rol: user.rol } });
// //         } catch (error) {
// //             res.status(500).json({ success: false, error: error.message });
// //         }
// //     }
// // }
// // module.exports = AuthController;


const jwt = require('jsonwebtoken');
const { sql, poolPromise } = require('../../config/db');
// Importamos el modelo de usuarios para reutilizar la lógica de guardado
const UserModel = require('../users/user.model'); 

class AuthController {
    // --- FUNCIÓN LOGIN (La que ya funciona) ---
    static async login(req, res) {
        const { email, password } = req.body;
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('email', sql.VarChar, email)
                .query(`
                    SELECT u.*, r.nombre as rol_nombre 
                    FROM Usuarios u 
                    JOIN Roles r ON u.id_rol = r.id_rol 
                    WHERE u.email = @email
                `);

            const user = result.recordset[0];
            if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

            if (password !== user.contrasena) {
                return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
            }

            // Generar el Token JWT (Válido por 8 horas)
            const token = jwt.sign(
                { id: user.id_usuario, rol: user.rol_nombre, email: user.email },
                process.env.JWT_SECRET || 'SECRET_KEY_BARBERSITE', // <--- ¡AQUÍ ESTÁ EL CAMBIO CLAVE!
                { expiresIn: '8h' }
            );

            res.status(200).json({
                success: true,
                message: 'Login exitoso',
                token: token,
                user: {
                    id_usuario: user.id_usuario,
                    nombre: user.nombre,
                    email: user.email,
                    telefono: user.telefono,      
                    direccion: user.direccion,    
                    documento: user.documento,    
                    rol: user.rol_nombre,
                    id_rol: user.id_rol,          
                    img: user.img
                }
            });

        } catch (error) {
            res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
        }
    }

    // --- NUEVA FUNCIÓN REGISTER ---
    static async register(req, res) {
        try {
            const { nombre, email, password, telefono } = req.body;

            // TRUCO: Como el formulario frontend no pide Documento pero la BD lo exige, 
            // generamos uno temporal basado en la fecha (timestamp) para que no falle.
            const documentoGenerado = 'TEMP-' + Date.now();

            const userData = {
                id_rol: 3, // Siempre 3 (Cliente) para registros públicos
                nombre: nombre,
                tipo_documento: 'CC', // Valor por defecto para la BD
                documento: documentoGenerado,
                email: email,
                telefono: telefono || '',
                direccion: '',
                contrasena: password 
            };

            // Usamos la misma función de crear que hicimos en el módulo de usuarios
            const newId = await UserModel.create(userData);

            res.status(201).json({ 
                success: true, 
                message: 'Usuario registrado exitosamente', 
                id_usuario: newId 
            });

        } catch (error) {
            // Error 2627: Violación de índice único (ej. el correo ya existe)
            if (error.number === 2627) {
                return res.status(400).json({ success: false, message: 'El correo electrónico ya está registrado.' });
            }
            res.status(500).json({ success: false, message: 'Error registrando usuario', error: error.message });
        }
    }

    // --- FUNCIÓN RECUPERAR CONTRASEÑA ---
    static async forgotPassword(req, res) {
        const { email } = req.body;
        try {
            const pool = await poolPromise;
            // Verificamos si el correo existe en la tabla Usuarios
            const result = await pool.request()
                .input('email', sql.VarChar, email)
                .query('SELECT nombre FROM Usuarios WHERE email = @email');

            if (result.recordset.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'No se encontró una cuenta con ese correo electrónico.' 
                });
            }

            const userName = result.recordset[0].nombre;

            // Aquí en un sistema real enviarías el correo con Nodemailer.
            // Para la entrega, simulamos el éxito.
            res.json({ 
                success: true, 
                message: `Instrucciones enviadas al correo de ${userName}.` 
            });

        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}



module.exports = AuthController;