const mongoose = require('mongoose');
const { verifyAccessToken } = require('../utils/jwt');

/**
 * JWT Authentication Middleware
 * Extracts token from Authorization header or cookie,
 * verifies it, and attaches user info to request.
 */
function authenticateJWT(req, res, next) {
    // Extract token from Authorization header or cookie
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = verifyAccessToken(token);

        // Set userId as string for Mongoose queries (find, findOne, etc.)
        req.userId = decoded.userId;
        // Set userObjectId for aggregation pipelines ($match requires ObjectId)
        req.userObjectId = new mongoose.Types.ObjectId(decoded.userId);
        // Set user role for RBAC (Phase 4)
        req.userRole = decoded.role;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = { authenticateJWT };
