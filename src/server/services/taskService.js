const Task = require('../models/Task');

/**
 * Fetch tasks for a specific date and auto-generate recurring instances
 */
async function getTasksByDate(userId, date) {
    // Generate recurring tasks first
    await generateRecurringTasks(userId, date);

    // Fetch tasks for this date (ownership enforced via userId filter)
    const tasks = await Task.find({
        userId,
        due_date: date,
        deletedAt: null,
    }).sort({ scheduled_time: 1, createdAt: 1 });

    return tasks;
}

/**
 * Auto-generate recurring task instances
 */
async function generateRecurringTasks(userId, targetDate) {
    try {
        // Find recurring tasks that should appear on this date
        const recurringTasks = await Task.find({
            userId,
            recurrence: { $ne: null },
            deletedAt: null,
            due_date: { $lte: targetDate },
            $or: [
                { recurrence_end: null },
                { recurrence_end: { $gte: targetDate } },
            ],
        });

        for (const task of recurringTasks) {
            // Check if task already exists for this date
            const exists = await Task.findOne({
                userId,
                title: task.title,
                scheduled_time: task.scheduled_time,
                due_date: targetDate,
                deletedAt: null,
            });

            if (exists) continue;

            // Check if this task should occur on targetDate based on recurrence
            const taskDate = new Date(task.due_date);
            const target = new Date(targetDate);

            let shouldGenerate = false;

            if (task.recurrence === 'daily') {
                shouldGenerate = target >= taskDate;
            } else if (task.recurrence === 'weekly') {
                const diffDays = Math.floor((target - taskDate) / (1000 * 60 * 60 * 24));
                shouldGenerate = diffDays >= 0 && diffDays % 7 === 0;
            } else if (task.recurrence === 'monthly') {
                shouldGenerate = target.getDate() === taskDate.getDate() && target >= taskDate;
            }

            if (shouldGenerate && targetDate !== task.due_date) {
                await Task.create({
                    userId,
                    title: task.title,
                    due_date: targetDate,
                    scheduled_time: task.scheduled_time,
                    category: task.category,
                    priority: task.priority,
                    notes: task.notes,
                    recurrence: task.recurrence,
                    recurrence_end: task.recurrence_end,
                });
            }
        }
    } catch (error) {
        console.error('Generate recurring tasks error:', error);
    }
}

/**
 * Create a new task
 */
async function createTask(userId, data) {
    const task = await Task.create({
        userId,
        title: data.title,
        due_date: data.due_date,
        scheduled_time: data.scheduled_time || null,
        category: data.category || 'general',
        priority: data.priority || 'medium',
        notes: data.notes || null,
        recurrence: data.recurrence || null,
        recurrence_end: data.recurrence_end || null,
    });
    return task;
}

/**
 * Update a task
 */
async function updateTask(userId, taskId, data) {
    const updates = {};

    if (data.title !== undefined) updates.title = data.title;
    if (data.scheduled_time !== undefined) updates.scheduled_time = data.scheduled_time;
    if (data.category !== undefined) updates.category = data.category;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.notes !== undefined) updates.notes = data.notes;

    if (data.status !== undefined) {
        if (!['todo', 'done'].includes(data.status)) {
            throw new Error('Status must be "todo" or "done"');
        }
        updates.status = data.status;
        updates.completed_at = data.status === 'done' ? new Date() : null;
    }

    if (Object.keys(updates).length === 0) {
        throw new Error('No fields to update');
    }

    const task = await Task.findOneAndUpdate(
        { _id: taskId, userId, deletedAt: null },
        { $set: updates },
        { new: true }
    );

    return task;
}

/**
 * Soft delete a task
 */
async function softDeleteTask(userId, taskId) {
    const task = await Task.findOneAndUpdate(
        { _id: taskId, userId, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true }
    );
    return task;
}

module.exports = {
    getTasksByDate,
    createTask,
    updateTask,
    softDeleteTask
};
