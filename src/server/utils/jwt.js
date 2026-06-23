const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * Generate a short-lived access token (15 minutes)
 * Contains userId and role for authorization
 */
function generateAccessToken(user) {
    return jwt.sign(
        {
            userId: user._id.toString(),
            role: user.role || 'USER',
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
}

/**
 * Generate a long-lived refresh token (7 days)
 * Contains only userId — used to issue new access tokens
 */
function generateRefreshToken(user) {
    return jwt.sign(
        {
            userId: user._id.toString(),
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
}

/**
 * Verify and decode an access token
 * @returns {{ userId: string, role: string }} decoded payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
function verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

/**
 * Verify and decode a refresh token
 * @returns {{ userId: string }} decoded payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
function verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

/**
 * Set refresh token as HTTP-only cookie
 */
function setRefreshTokenCookie(res, token) {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
    });
}

/**
 * Clear refresh token cookie
 */
function clearRefreshTokenCookie(res) {
    res.cookie('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 0,
        path: '/',
    });
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    setRefreshTokenCookie,
    clearRefreshTokenCookie,
};
