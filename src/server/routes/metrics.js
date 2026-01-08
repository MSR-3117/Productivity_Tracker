const express = require('express');
const { db } = require('../../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

/**
 * GET /metrics/monthly
 */
router.get('/monthly', (req, res) => {
    try {
        const metrics = db.prepare(`
      SELECT month_year, total_tasks, completed_tasks, completion_rate
      FROM monthly_dedication
      WHERE user_id = ?
      ORDER BY month_year DESC
    `).all(req.userId);

        res.json({ metrics });
    } catch (error) {
        console.error('Get metrics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /metrics/streaks
 */
router.get('/streaks', (req, res) => {
    try {
        const completedDates = db.prepare(`
      SELECT DISTINCT due_date
      FROM tasks
      WHERE user_id = ? 
        AND status = 'done' 
        AND deleted_at IS NULL
      ORDER BY due_date DESC
    `).all(req.userId);

        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        let checkDate = new Date(today);

        for (const row of completedDates) {
            const taskDate = new Date(row.due_date);
            const diffDays = Math.floor((checkDate - taskDate) / (1000 * 60 * 60 * 24));

            if (diffDays <= 1) {
                streak++;
                checkDate = taskDate;
            } else {
                break;
            }
        }

        res.json({ streak_days: streak });
    } catch (error) {
        console.error('Get streaks error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /metrics/analytics
 * Comprehensive analytics for dashboard
 */
router.get('/analytics', (req, res) => {
    try {
        // Category breakdown
        const categories = db.prepare(`
            SELECT 
                COALESCE(category, 'general') as category,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed
            FROM tasks
            WHERE user_id = ? AND deleted_at IS NULL
            GROUP BY category
        `).all(req.userId);

        // Hourly performance (which hours are most productive)
        const hourlyStats = db.prepare(`
            SELECT 
                CAST(SUBSTR(scheduled_time, 1, 2) AS INTEGER) as hour,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed
            FROM tasks
            WHERE user_id = ? AND deleted_at IS NULL AND scheduled_time IS NOT NULL
            GROUP BY hour
            ORDER BY hour
        `).all(req.userId);

        // Weekly heatmap data (last 7 weeks)
        const heatmapData = db.prepare(`
            SELECT 
                due_date,
                strftime('%w', due_date) as day_of_week,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed
            FROM tasks
            WHERE user_id = ? 
                AND deleted_at IS NULL 
                AND due_date >= date('now', '-49 days')
            GROUP BY due_date
            ORDER BY due_date
        `).all(req.userId);

        // Weekly trend (last 8 weeks)
        const weeklyTrend = db.prepare(`
            SELECT 
                strftime('%Y-W%W', due_date) as week,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed,
                ROUND(100.0 * SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) / COUNT(*), 1) as rate
            FROM tasks
            WHERE user_id = ? 
                AND deleted_at IS NULL 
                AND due_date >= date('now', '-56 days')
            GROUP BY week
            ORDER BY week
        `).all(req.userId);

        // Best performing time slots
        const bestHours = hourlyStats
            .filter(h => h.total >= 2)
            .sort((a, b) => (b.completed / b.total) - (a.completed / a.total))
            .slice(0, 3);

        // Summary stats
        const summary = db.prepare(`
            SELECT 
                COUNT(*) as total_tasks,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
                COUNT(DISTINCT due_date) as active_days,
                COUNT(DISTINCT CASE WHEN status = 'done' THEN due_date END) as productive_days
            FROM tasks
            WHERE user_id = ? AND deleted_at IS NULL
        `).get(req.userId);

        // This week vs last week comparison
        const thisWeek = db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed
            FROM tasks
            WHERE user_id = ? 
                AND deleted_at IS NULL 
                AND due_date >= date('now', 'weekday 0', '-6 days')
        `).get(req.userId);

        const lastWeek = db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed
            FROM tasks
            WHERE user_id = ? 
                AND deleted_at IS NULL 
                AND due_date >= date('now', 'weekday 0', '-13 days')
                AND due_date < date('now', 'weekday 0', '-6 days')
        `).get(req.userId);

        const weeklyChange = lastWeek?.completed > 0
            ? Math.round(((thisWeek?.completed || 0) - lastWeek.completed) / lastWeek.completed * 100)
            : 0;

        res.json({
            categories,
            hourlyStats,
            heatmapData,
            weeklyTrend,
            bestHours,
            summary: summary || { total_tasks: 0, completed_tasks: 0, active_days: 0, productive_days: 0 },
            comparison: {
                thisWeek: thisWeek || { total: 0, completed: 0 },
                lastWeek: lastWeek || { total: 0, completed: 0 },
                change: weeklyChange
            }
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
