const metricsService = require('../services/metricsService');

async function getMonthly(req, res) {
    try {
        const metrics = await metricsService.getMonthlyMetrics(req.userObjectId);
        res.json({ metrics });
    } catch (error) {
        console.error('Get metrics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getStreaks(req, res) {
    try {
        const streak_days = await metricsService.getStreaks(req.userObjectId);
        res.json({ streak_days });
    } catch (error) {
        console.error('Get streaks error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getAnalytics(req, res) {
    try {
        const analytics = await metricsService.getAnalytics(req.userObjectId);
        res.json(analytics);
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getMonthly,
    getStreaks,
    getAnalytics
};
