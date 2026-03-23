const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'thinknode_secret');

            req.admin = { id: decoded.id, username: decoded.username };

            return next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authMiddleware = (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'thinknode_secret');

            req.user = { 
                id: decoded.id, 
                username: decoded.username, 
                role: decoded.role || 'customer' 
            };

            return next();
        } catch (error) {
            return res.status(401).json({ 
                success: false,
                message: 'Not authorized, token failed' 
            });
        }
    }

    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Not authorized, no token provided' 
        });
    }
};

module.exports = { protect, authMiddleware };
