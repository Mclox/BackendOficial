const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ success: false, message: 'No se proporcionó un token' });

    try {
        const decoded = jwt.verify(token.split(" ")[1], 'SECRET_KEY_BARBERSITE');
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
        
        // Admin / Administrador siempre tiene todos los permisos
        if (req.user.rol === 'Administrador' || req.user.rol === 'Admin') {
            return next();
        }
        
        try {
            const { poolPromise } = require('../config/db');
            const pool = await poolPromise;
            
            // Buscar el rol y sus permisos
            const result = await pool.request()
                .input('rol_nombre', req.user.rol)
                .query("SELECT permisos FROM Roles WHERE nombre = @rol_nombre AND estado = 'Activo'");
                
            if (result.recordset.length === 0) {
                return res.status(403).json({ success: false, message: 'Rol no encontrado o inactivo' });
            }
            
            const role = result.recordset[0];
            const permisos = role.permisos ? JSON.parse(role.permisos) : [];
            
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