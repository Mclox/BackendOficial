const jwt = require('jsonwebtoken');
const db = require('../config/db');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ success: false, message: 'No se proporcionó un token' });

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, 'SECRET_KEY_BARBERSITE');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }
};

const checkPermission = (modulo, accion) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }
        
        // El Administrador o Admin siempre tiene acceso a todo
        if (req.user.rol === 'Administrador' || req.user.rol === 'Admin') {
            return next();
        }

        // El Cliente puede leer su propio perfil del módulo Clientes
        if (req.user.rol === 'Cliente' && modulo === 'Clientes' && accion === 'leer') {
            return next();
        }
        
        try {
            // Buscamos el rol en PostgreSQL usando db.query
            const result = await db.query(
                "SELECT permisos FROM Roles WHERE nombre = $1 AND estado = 'Activo'",
                [req.user.rol]
            );
                
            if (result.rows.length === 0) {
                return res.status(403).json({ success: false, message: 'Rol no encontrado o inactivo' });
            }
            
            const role = result.rows[0];
            const permisos = role.permisos ? (typeof role.permisos === 'string' ? JSON.parse(role.permisos) : role.permisos) : [];
            
            // Buscar el permiso para el módulo
            const permiso = permisos.find(p => p.modulo.toLowerCase() === modulo.toLowerCase());
            
            if (permiso && permiso[accion] === true) {
                return next();
            }
            
            return res.status(403).json({ success: false, message: `No tienes permiso para ${accion} en el módulo ${modulo}` });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error al verificar permisos', error: error.message });
        }
    };
};

module.exports = { verifyToken, checkPermission };