const express = require('express');
const { db } = require('../../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * DEBUG ROUTE - Development only!
 * View database contents
 * REMOVE THIS IN PRODUCTION
 */
router.get('/db', requireAuth, (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Not available in production' });
    }

    try {
        const tables = {};

        // Get user info (excluding password)
        tables.users = db.prepare(`
            SELECT id, email, created_at FROM users
        `).all();

        // Get user's tasks
        tables.tasks = db.prepare(`
            SELECT id, title, status, due_date, scheduled_time, category, priority, recurrence, completed_at, deleted_at, created_at
            FROM tasks WHERE user_id = ?
            ORDER BY due_date DESC, scheduled_time ASC
            LIMIT 50
        `).all(req.userId);

        // Get user's settings
        tables.settings = db.prepare(`
            SELECT * FROM user_settings WHERE user_id = ?
        `).get(req.userId);

        // Get monthly metrics
        tables.metrics = db.prepare(`
            SELECT * FROM monthly_dedication WHERE user_id = ?
        `).all(req.userId);

        // Get database stats
        const stats = {
            totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get()?.count || 0,
            totalTasks: db.prepare('SELECT COUNT(*) as count FROM tasks WHERE deleted_at IS NULL').get()?.count || 0,
            completedTasks: db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = "done" AND deleted_at IS NULL').get()?.count || 0,
        };

        res.json({
            message: 'Debug data (development only)',
            yourUserId: req.userId,
            stats,
            tables
        });
    } catch (error) {
        console.error('Debug DB error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DEBUG ROUTE - View schema
 */
router.get('/schema', requireAuth, (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Not available in production' });
    }

    try {
        const schema = db.prepare(`
            SELECT name, sql FROM sqlite_master 
            WHERE type IN ('table', 'view') 
            ORDER BY type, name
        `).all();

        res.json({ schema });
    } catch (error) {
        console.error('Debug schema error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
