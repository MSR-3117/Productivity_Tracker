const Task = require('../models/Task');

/**
 * Get monthly metrics
 */
async function getMonthlyMetrics(userId) {
    return await Task.aggregate([
        {
            $match: {
                userId,
                deletedAt: null,
            },
        },
        {
            $group: {
                _id: { $substr: ['$due_date', 0, 7] }, // 'YYYY-MM'
                total_tasks: { $sum: 1 },
                completed_tasks: {
                    $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] },
                },
            },
        },
        {
            $project: {
                _id: 0,
                month_year: '$_id',
                total_tasks: 1,
                completed_tasks: 1,
                completion_rate: {
                    $round: [
                        { $multiply: [{ $divide: ['$completed_tasks', '$total_tasks'] }, 100] },
                        2,
                    ],
                },
            },
        },
        { $sort: { month_year: -1 } },
    ]);
}

/**
 * Get consecutive streak days
 */
async function getStreaks(userId) {
    const completedDates = await Task.distinct('due_date', {
        userId,
        status: 'done',
        deletedAt: null,
    });

    // Sort dates descending
    completedDates.sort((a, b) => b.localeCompare(a));

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date(today);

    for (const dateStr of completedDates) {
        const taskDate = new Date(dateStr);
        const diffDays = Math.floor((checkDate - taskDate) / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
            streak++;
            checkDate = taskDate;
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Get comprehensive analytics
 */
async function getAnalytics(userId) {
    const today = new Date();
    const fortyNineDaysAgo = new Date(today);
    fortyNineDaysAgo.setDate(fortyNineDaysAgo.getDate() - 49);
    const fiftyNineDaysAgo = new Date(today);
    fiftyNineDaysAgo.setDate(fiftyNineDaysAgo.getDate() - 56);

    const fortyNineDaysAgoStr = fortyNineDaysAgo.toISOString().split('T')[0];
    const fiftyNineDaysAgoStr = fiftyNineDaysAgo.toISOString().split('T')[0];

    // Get start of this week (Monday)
    const dayOfWeek = today.getDay();
    const startOfThisWeek = new Date(today);
    startOfThisWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    const startOfThisWeekStr = startOfThisWeek.toISOString().split('T')[0];
    const startOfLastWeekStr = startOfLastWeek.toISOString().split('T')[0];

    // Run all aggregations in parallel
    const [categories, hourlyStats, heatmapData, weeklyTrend, summary, thisWeekData, lastWeekData] = await Promise.all([
        // Category breakdown
        Task.aggregate([
            { $match: { userId, deletedAt: null } },
            {
                $group: {
                    _id: { $ifNull: ['$category', 'general'] },
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
                },
            },
            { $project: { _id: 0, category: '$_id', total: 1, completed: 1 } },
        ]),

        // Hourly performance
        Task.aggregate([
            {
                $match: {
                    userId,
                    deletedAt: null,
                    scheduled_time: { $ne: null },
                },
            },
            {
                $project: {
                    hour: { $toInt: { $substr: ['$scheduled_time', 0, 2] } },
                    status: 1,
                },
            },
            {
                $group: {
                    _id: '$hour',
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
                },
            },
            { $project: { _id: 0, hour: '$_id', total: 1, completed: 1 } },
            { $sort: { hour: 1 } },
        ]),

        // Weekly heatmap data (last 7 weeks)
        Task.aggregate([
            {
                $match: {
                    userId,
                    deletedAt: null,
                    due_date: { $gte: fortyNineDaysAgoStr },
                },
            },
            {
                $group: {
                    _id: '$due_date',
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
                },
            },
            {
                $project: {
                    _id: 0,
                    due_date: '$_id',
                    total: 1,
                    completed: 1,
                },
            },
            { $sort: { due_date: 1 } },
        ]),

        // Weekly trend (last 8 weeks)
        Task.aggregate([
            {
                $match: {
                    userId,
                    deletedAt: null,
                    due_date: { $gte: fiftyNineDaysAgoStr },
                },
            },
            {
                $addFields: {
                    // Convert due_date string to date for week calculation
                    dueDateObj: { $dateFromString: { dateString: '$due_date', format: '%Y-%m-%d' } },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-W%V', date: '$dueDateObj' } },
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
                },
            },
            {
                $project: {
                    _id: 0,
                    week: '$_id',
                    total: 1,
                    completed: 1,
                    rate: {
                        $round: [{ $multiply: [{ $divide: ['$completed', '$total'] }, 100] }, 1],
                    },
                },
            },
            { $sort: { week: 1 } },
        ]),

        // Summary stats
        Task.aggregate([
            { $match: { userId, deletedAt: null } },
            {
                $group: {
                    _id: null,
                    total_tasks: { $sum: 1 },
                    completed_tasks: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
                    active_days: { $addToSet: '$due_date' },
                    productive_days: {
                        $addToSet: {
                            $cond: [{ $eq: ['$status', 'done'] }, '$due_date', '$$REMOVE'],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    total_tasks: 1,
                    completed_tasks: 1,
                    active_days: { $size: '$active_days' },
                    productive_days: { $size: '$productive_days' },
                },
            },
        ]),

        // This week
        Task.aggregate([
            {
                $match: {
                    userId,
                    deletedAt: null,
                    due_date: { $gte: startOfThisWeekStr },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
                },
            },
        ]),

        // Last week
        Task.aggregate([
            {
                $match: {
                    userId,
                    deletedAt: null,
                    due_date: { $gte: startOfLastWeekStr, $lt: startOfThisWeekStr },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
                },
            },
        ]),
    ]);

    // Best performing time slots
    const bestHours = hourlyStats
        .filter(h => h.total >= 2)
        .sort((a, b) => (b.completed / b.total) - (a.completed / a.total))
        .slice(0, 3);

    const summaryData = summary[0] || { total_tasks: 0, completed_tasks: 0, active_days: 0, productive_days: 0 };
    const thisWeek = thisWeekData[0] || { total: 0, completed: 0 };
    const lastWeek = lastWeekData[0] || { total: 0, completed: 0 };

    const weeklyChange = lastWeek.completed > 0
        ? Math.round(((thisWeek.completed || 0) - lastWeek.completed) / lastWeek.completed * 100)
        : 0;

    return {
        categories,
        hourlyStats,
        heatmapData,
        weeklyTrend,
        bestHours,
        summary: summaryData,
        comparison: {
            thisWeek,
            lastWeek,
            change: weeklyChange,
        },
    };
}

module.exports = {
    getMonthlyMetrics,
    getStreaks,
    getAnalytics
};
