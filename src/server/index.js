/**
 * Local development entry point
 * Connects to MongoDB and starts the Express server
 * For Vercel deployment, see api/index.js
 */
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

async function startServer() {
    await connectDB();

    // Listen on all interfaces (0.0.0.0) for mobile/LAN access
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
        console.log(`API endpoints available at http://localhost:${PORT}/api`);
    });
}

startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

module.exports = app;
