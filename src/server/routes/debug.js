const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const UserSettings = require('../models/UserSettings');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

/**
 * DEBUG ROUTE - Development only!
 * View database contents
 * REMOVE THIS IN PRODUCTION
 */
router.get('/db', authenticateJWT, async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Not available in production' });
    }

    try {
        const tables = {};

        // Get user info (passwordHash excluded by model's toJSON)
        tables.users = await User.find({}).select('-passwordHash -refreshToken');

        // Get user's tasks (most recent 50)
        tables.tasks = await Task.find({ userId: req.userId })
            .sort({ due_date: -1, scheduled_time: 1 })
            .limit(50);

        // Get user's settings
        tables.settings = await UserSettings.findOne({ userId: req.userId });

        // Get database stats
        const [totalUsers, totalTasks, completedTasks] = await Promise.all([
            User.countDocuments(),
            Task.countDocuments({ deletedAt: null }),
            Task.countDocuments({ status: 'done', deletedAt: null }),
        ]);

        res.json({
            message: 'Debug data (development only)',
            yourUserId: req.userId,
            stats: { totalUsers, totalTasks, completedTasks },
            tables,
        });
    } catch (error) {
        console.error('Debug DB error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DEBUG ROUTE - View collections
 */
router.get('/schema', authenticateJWT, async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Not available in production' });
    }

    try {
        const mongoose = require('mongoose');
        const collections = await mongoose.connection.db.listCollections().toArray();

        res.json({
            collections: collections.map(c => ({
                name: c.name,
                type: c.type,
            })),
        });
    } catch (error) {
        console.error('Debug schema error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
