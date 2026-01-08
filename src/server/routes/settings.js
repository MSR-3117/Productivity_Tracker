const express = require('express');
const { db } = require('../../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

/**
 * GET /settings
 * Get user settings (theme)
 */
router.get('/', (req, res) => {
    try {
        let settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.userId);

        if (!settings) {
            // Create default settings
            db.prepare('INSERT INTO user_settings (user_id, theme) VALUES (?, ?)').run(req.userId, 'dark');
            settings = { user_id: req.userId, theme: 'dark' };
        }

        res.json({ settings });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /settings
 * Update user settings
 */
router.put('/', (req, res) => {
    try {
        const { theme } = req.body;

        if (theme && !['dark', 'light'].includes(theme)) {
            return res.status(400).json({ error: 'Theme must be "dark" or "light"' });
        }

        // Upsert settings
        const existing = db.prepare('SELECT user_id FROM user_settings WHERE user_id = ?').get(req.userId);

        if (existing) {
            if (theme) {
                db.prepare('UPDATE user_settings SET theme = ? WHERE user_id = ?').run(theme, req.userId);
            }
        } else {
            db.prepare('INSERT INTO user_settings (user_id, theme) VALUES (?, ?)').run(req.userId, theme || 'dark');
        }

        const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.userId);
        res.json({ settings });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
