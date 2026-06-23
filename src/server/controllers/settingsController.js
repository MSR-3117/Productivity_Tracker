const settingsService = require('../services/settingsService');

async function getSettings(req, res) {
    try {
        const settings = await settingsService.getSettings(req.userId);
        res.json({ settings });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function updateSettings(req, res) {
    try {
        const settings = await settingsService.updateSettings(req.userId, req.body);
        res.json({ settings });
    } catch (error) {
        if (error.message === 'Theme must be "dark" or "light"') {
            return res.status(400).json({ error: error.message });
        }
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getSettings,
    updateSettings
};
