const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const { initializeDatabase } = require('../db');
const { attachUser } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const metricsRoutes = require('./routes/metrics');
const settingsRoutes = require('./routes/settings');
const debugRoutes = require('./routes/debug');

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet());

// CORS for React frontend (allow mobile testing on local network)
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        // Allow localhost and local network IPs
        const allowed = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            /^http:\/\/192\.168\.\d+\.\d+:5173$/,
            /^http:\/\/10\.\d+\.\d+\.\d+:5173$/,
        ];
        const isAllowed = allowed.some(pattern =>
            pattern instanceof RegExp ? pattern.test(origin) : pattern === origin
        );
        callback(null, isAllowed);
    },
    credentials: true,
}));

// Body parsing
app.use(express.json());

// Session configuration per SECURITY.md
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,                    // Prevent XSS access
        secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
        sameSite: 'strict',                // CSRF protection
        maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 days per SECURITY.md
    },
}));

// Attach user to request
app.use(attachUser);

// Routes
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/metrics', metricsRoutes);
app.use('/settings', settingsRoutes);
app.use('/debug', debugRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start server with async db init
async function startServer() {
    await initializeDatabase();
    // Listen on all interfaces (0.0.0.0) for mobile access
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
        console.log(`Access from phone: http://192.168.0.6:${PORT}`);
    });
}

startServer().catch(console.error);

module.exports = app;
