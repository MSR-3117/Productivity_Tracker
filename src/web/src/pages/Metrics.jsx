import { useState, useEffect } from 'react';
import { metrics as metricsApi } from '../utils/api';
import './Metrics.css';

const CATEGORY_COLORS = {
    work: '#6366f1',
    personal: '#8b5cf6',
    health: '#10b981',
    learning: '#f59e0b',
    general: '#6b7280',
};

export function MetricsPage() {
    const [analytics, setAnalytics] = useState(null);
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const [analyticsRes, streakRes] = await Promise.all([
                metricsApi.getAnalytics(),
                metricsApi.getStreaks(),
            ]);
            setAnalytics(analyticsRes);
            setStreak(streakRes.streak_days || 0);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="analytics-loading">Loading analytics...</div>;
    if (error) return <div className="analytics-error">{error}</div>;
    if (!analytics) return null;

    const { categories, hourlyStats, heatmapData, weeklyTrend, bestHours, summary, comparison } = analytics;
    const totalTasks = summary.total_tasks || 0;
    const completedTasks = summary.completed_tasks || 0;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Build 7-week heatmap grid
    const buildHeatmapGrid = () => {
        const grid = [];
        const today = new Date();
        for (let week = 6; week >= 0; week--) {
            const weekData = [];
            for (let day = 0; day < 7; day++) {
                const d = new Date(today);
                d.setDate(d.getDate() - (week * 7 + (6 - day)));
                const dateStr = d.toISOString().split('T')[0];
                const data = heatmapData.find(h => h.due_date === dateStr);
                weekData.push({
                    date: dateStr,
                    total: data?.total || 0,
                    completed: data?.completed || 0,
                    rate: data?.total > 0 ? data.completed / data.total : 0,
                });
            }
            grid.push(weekData);
        }
        return grid;
    };

    const heatmapGrid = buildHeatmapGrid();
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Category pie chart
    const totalCategoryTasks = categories.reduce((sum, c) => sum + c.total, 0) || 1;
    let cumulativePercent = 0;

    return (
        <div className="analytics-container">
            {/* Header */}
            <div className="analytics-header">
                <h1>📊 Analytics Dashboard</h1>
                <p className="analytics-subtitle">Your productivity insights at a glance</p>
            </div>

            {/* Quick Stats Row */}
            <div className="stats-row">
                <div className="stat-card accent">
                    <div className="stat-icon">🔥</div>
                    <div className="stat-content">
                        <div className="stat-value">{streak}</div>
                        <div className="stat-label">Day Streak</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✓</div>
                    <div className="stat-content">
                        <div className="stat-value">{completedTasks}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                        <div className="stat-value">{completionRate}%</div>
                        <div className="stat-label">Success Rate</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                        <div className="stat-value">{summary.productive_days || 0}</div>
                        <div className="stat-label">Productive Days</div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="analytics-grid">
                {/* Weekly Comparison */}
                <div className="analytics-card comparison-card">
                    <h3>📊 This Week vs Last Week</h3>
                    <div className="comparison-content">
                        <div className="comparison-item">
                            <span className="comparison-label">This Week</span>
                            <span className="comparison-value">{comparison.thisWeek.completed}/{comparison.thisWeek.total}</span>
                        </div>
                        <div className="comparison-arrow">
                            {comparison.change > 0 ? '📈' : comparison.change < 0 ? '📉' : '➡️'}
                        </div>
                        <div className="comparison-item">
                            <span className="comparison-label">Last Week</span>
                            <span className="comparison-value">{comparison.lastWeek.completed}/{comparison.lastWeek.total}</span>
                        </div>
                    </div>
                    <div className={`comparison-change ${comparison.change >= 0 ? 'positive' : 'negative'}`}>
                        {comparison.change >= 0 ? '+' : ''}{comparison.change}% change
                    </div>
                </div>

                {/* Category Pie Chart */}
                <div className="analytics-card pie-card">
                    <h3>📂 By Category</h3>
                    <div className="pie-container">
                        <svg viewBox="0 0 100 100" className="pie-chart">
                            {categories.map((cat, i) => {
                                const percent = (cat.total / totalCategoryTasks) * 100;
                                const startAngle = cumulativePercent * 3.6;
                                cumulativePercent += percent;
                                const endAngle = cumulativePercent * 3.6;
                                const largeArc = percent > 50 ? 1 : 0;
                                const startX = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                                const startY = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                                const endX = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                                const endY = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                                return (
                                    <path
                                        key={cat.category}
                                        d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`}
                                        fill={CATEGORY_COLORS[cat.category] || '#6b7280'}
                                    />
                                );
                            })}
                            <circle cx="50" cy="50" r="25" fill="var(--bg-card)" />
                            <text x="50" y="53" textAnchor="middle" className="pie-center-text">{totalCategoryTasks}</text>
                        </svg>
                        <div className="pie-legend">
                            {categories.map(cat => (
                                <div key={cat.category} className="legend-item">
                                    <span className="legend-dot" style={{ backgroundColor: CATEGORY_COLORS[cat.category] }}></span>
                                    <span className="legend-name">{cat.category}</span>
                                    <span className="legend-count">{cat.total}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Weekly Heat Map */}
                <div className="analytics-card heatmap-card">
                    <h3>🗓️ 7-Week Activity Map</h3>
                    <div className="heatmap-container">
                        <div className="heatmap-labels">
                            {dayLabels.map(d => <span key={d}>{d}</span>)}
                        </div>
                        <div className="heatmap-grid">
                            {heatmapGrid.map((week, wi) => (
                                <div key={wi} className="heatmap-week">
                                    {week.map((day, di) => (
                                        <div
                                            key={di}
                                            className="heatmap-cell"
                                            style={{
                                                backgroundColor: day.total === 0
                                                    ? 'var(--bg-secondary)'
                                                    : `rgba(16, 185, 129, ${0.2 + day.rate * 0.8})`,
                                            }}
                                            title={`${day.date}: ${day.completed}/${day.total} completed`}
                                        >
                                            {day.rate === 1 && day.total > 0 && '✓'}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="heatmap-scale">
                            <span>Less</span>
                            <div className="scale-boxes">
                                <div style={{ backgroundColor: 'var(--bg-secondary)' }}></div>
                                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.3)' }}></div>
                                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.5)' }}></div>
                                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.7)' }}></div>
                                <div style={{ backgroundColor: 'rgba(16, 185, 129, 1)' }}></div>
                            </div>
                            <span>More</span>
                        </div>
                    </div>
                </div>

                {/* Best Hours */}
                <div className="analytics-card insights-card">
                    <h3>⏰ Best Performing Hours</h3>
                    {bestHours.length > 0 ? (
                        <div className="best-hours">
                            {bestHours.map((h, i) => (
                                <div key={h.hour} className="best-hour-item">
                                    <span className="hour-rank">{['🥇', '🥈', '🥉'][i]}</span>
                                    <span className="hour-time">{h.hour}:00</span>
                                    <span className="hour-rate">{Math.round((h.completed / h.total) * 100)}%</span>
                                    <span className="hour-count">{h.completed}/{h.total}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-data">Complete more tasks at specific times to see insights</p>
                    )}
                </div>

                {/* Hourly Performance Chart */}
                <div className="analytics-card hourly-card">
                    <h3>📊 Hourly Performance</h3>
                    <div className="hourly-chart">
                        {Array.from({ length: 19 }, (_, i) => i + 5).map(hour => {
                            const data = hourlyStats.find(h => h.hour === hour);
                            const rate = data?.total > 0 ? (data.completed / data.total) : 0;
                            const hasData = data?.total > 0;
                            return (
                                <div key={hour} className="hourly-bar-container">
                                    <div
                                        className="hourly-bar"
                                        style={{
                                            height: `${hasData ? rate * 100 : 5}%`,
                                            backgroundColor: hasData ? `hsl(${120 * rate}, 70%, 50%)` : 'var(--bg-secondary)',
                                        }}
                                        title={hasData ? `${hour}:00 - ${data.completed}/${data.total} (${Math.round(rate * 100)}%)` : `${hour}:00 - No tasks`}
                                    ></div>
                                    <span className="hourly-label">{hour}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Weekly Trend Line */}
                <div className="analytics-card trend-card">
                    <h3>📈 Weekly Trend</h3>
                    {weeklyTrend.length > 1 ? (
                        <div className="trend-chart">
                            <svg viewBox="0 0 400 100" className="trend-svg">
                                <defs>
                                    <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="rgba(99, 102, 241, 0.3)" />
                                        <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
                                    </linearGradient>
                                </defs>
                                {/* Area fill */}
                                <path
                                    d={`M 20 ${100 - (weeklyTrend[0]?.rate || 0)} ${weeklyTrend.map((w, i) => `L ${20 + i * (360 / (weeklyTrend.length - 1))} ${100 - (w.rate || 0)}`).join(' ')} L ${20 + (weeklyTrend.length - 1) * (360 / (weeklyTrend.length - 1))} 100 L 20 100 Z`}
                                    fill="url(#trendGradient)"
                                />
                                {/* Line */}
                                <polyline
                                    points={weeklyTrend.map((w, i) => `${20 + i * (360 / (weeklyTrend.length - 1))},${100 - (w.rate || 0)}`).join(' ')}
                                    fill="none"
                                    stroke="var(--accent-primary)"
                                    strokeWidth="2"
                                />
                                {/* Points */}
                                {weeklyTrend.map((w, i) => (
                                    <circle
                                        key={i}
                                        cx={20 + i * (360 / (weeklyTrend.length - 1))}
                                        cy={100 - (w.rate || 0)}
                                        r="4"
                                        fill="var(--accent-primary)"
                                    />
                                ))}
                            </svg>
                            <div className="trend-labels">
                                {weeklyTrend.map((w, i) => (
                                    <span key={i}>{w.rate}%</span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="no-data">Need more weekly data to show trend</p>
                    )}
                </div>
            </div>
        </div>
    );
}
