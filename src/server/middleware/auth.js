/**
 * Authentication middleware
 * Validates session and attaches user to request
 */
function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}

/**
 * Attach user ID to request for convenience
 */
function attachUser(req, res, next) {
    if (req.session && req.session.userId) {
        req.userId = req.session.userId;
    }
    next();
}

module.exports = { requireAuth, attachUser };
