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

module.exports = { verifyToken };