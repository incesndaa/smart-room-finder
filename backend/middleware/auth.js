const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Akses ditolak. Silakan login.' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log('User role:', req.user.role); // Debug
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'sekre' && req.user.role !== 'bsp') {
        return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }
    next();
};

module.exports = { verifyToken, isAdmin };