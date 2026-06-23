/**
 * Vercel Serverless Function Entry Point
 * Exports the Express app as a single serverless function
 * All /api/* requests are routed here via vercel.json rewrites
 */
const mongoose = require('mongoose');

// Load environment variables (Vercel provides them automatically)
let isConnected = false;

async function connectDB() {
    if (isConnected) return;

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is required');
    }

    if (mongoose.connection.readyState === 0) {
        mongoose.set('strictQuery', true);
        await mongoose.connect(mongoUri, { autoIndex: true });
        isConnected = true;
        console.log('MongoDB connected (Vercel serverless)');
    } else {
        isConnected = true;
    }
}

// Import the Express app
const app = require('../src/server/app');

// Wrap with DB connection for serverless
module.exports = async (req, res) => {
    await connectDB();
    return app(req, res);
};
