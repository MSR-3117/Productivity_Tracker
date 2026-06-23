const authService = require('../services/authService');
const { setRefreshTokenCookie, clearRefreshTokenCookie } = require('../utils/jwt');

async function register(req, res) {
    try {
        const { email, password, name } = req.body;
        const { user, accessToken, refreshToken } = await authService.registerUser(email, password, name);
        
        setRefreshTokenCookie(res, refreshToken);
        res.status(201).json({
            message: 'User created successfully',
            accessToken,
            user: user.toJSON(),
        });
    } catch (error) {
        if (error.message === 'Email already registered') {
            return res.status(409).json({ error: error.message });
        }
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;
        const { user, accessToken, refreshToken } = await authService.loginUser(email, password);

        setRefreshTokenCookie(res, refreshToken);
        res.json({
            message: 'Login successful',
            accessToken,
            user: user.toJSON(),
        });
    } catch (error) {
        if (error.message === 'Invalid email or password') {
            return res.status(401).json({ error: error.message });
        }
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function refresh(req, res) {
    try {
        const token = req.cookies?.refreshToken;
        const { newAccessToken, newRefreshToken } = await authService.refreshTokens(token);

        setRefreshTokenCookie(res, newRefreshToken);
        res.json({ accessToken: newAccessToken });
    } catch (error) {
        clearRefreshTokenCookie(res);
        const status = error.message === 'Refresh token required' || error.message.includes('Invalid') || error.message.includes('Token reuse') ? 401 : 500;
        if (status === 500) console.error('Refresh error:', error);
        res.status(status).json({ error: status === 500 ? 'Internal server error' : error.message });
    }
}

async function logout(req, res) {
    try {
        const token = req.cookies?.refreshToken;
        await authService.logoutUser(token);
        clearRefreshTokenCookie(res);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function me(req, res) {
    try {
        const user = await authService.getUserById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user: user.toJSON() });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function googleCallback(req, res) {
    try {
        // req.user from passport callback
        const { accessToken, refreshToken } = await authService.handleGoogleOAuth(req.user);
        
        setRefreshTokenCookie(res, refreshToken);
        const redirectUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(`${redirectUrl}/?token=${accessToken}`);
    } catch (error) {
        console.error('Google callback error:', error);
        res.redirect('/login?error=internal_error');
    }
}

module.exports = {
    register,
    login,
    refresh,
    logout,
    me,
    googleCallback
};
