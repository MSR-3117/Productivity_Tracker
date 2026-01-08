const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { db } = require('../../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All task routes require authentication
router.use(requireAuth);

/**
 * Handle validation errors
 */
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: errors.array()[0].msg,
            errors: errors.array()
        });
    }
    next();
}

/**
 * GET /tasks?date=YYYY-MM-DD
 * Retrieve user's tasks for a specific date
 * Auto-generates recurring task instances
 * Per SECURITY.md: includes user_id filter (ownership enforcement)
 */
router.get('/',
    query('date').isDate().withMessage('Date must be in YYYY-MM-DD format'),
    handleValidationErrors,
    (req, res) => {
        try {
            const { date } = req.query;

            // First, generate any recurring tasks for this date
            generateRecurringTasks(req.userId, date);

            // Ownership enforcement per SECURITY.md
            const tasks = db.prepare(`
      SELECT id, title, status, due_date, scheduled_time, category, priority, notes, recurrence, completed_at, created_at
      FROM tasks 
      WHERE user_id = ? AND due_date = ? AND deleted_at IS NULL
      ORDER BY scheduled_time ASC, created_at ASC
    `).all(req.userId, date);

            res.json({ tasks });
        } catch (error) {
            console.error('Get tasks error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

/**
 * Auto-generate recurring task instances
 */
function generateRecurringTasks(userId, targetDate) {
    // Find recurring tasks that should appear on this date
    const recurringTasks = db.prepare(`
        SELECT * FROM tasks 
        WHERE user_id = ? 
        AND recurrence IS NOT NULL 
        AND deleted_at IS NULL
        AND due_date <= ?
        AND (recurrence_end IS NULL OR recurrence_end >= ?)
    `).all(userId, targetDate, targetDate);

    for (const task of recurringTasks) {
        // Check if task already exists for this date
        const exists = db.prepare(`
            SELECT id FROM tasks 
            WHERE user_id = ? AND title = ? AND scheduled_time = ? AND due_date = ? AND deleted_at IS NULL
        `).get(userId, task.title, task.scheduled_time, targetDate);

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
            // Create new instance for this date
            db.prepare(`
                INSERT INTO tasks (user_id, title, due_date, scheduled_time, category, priority, notes, recurrence, recurrence_end)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                userId,
                task.title,
                targetDate,
                task.scheduled_time,
                task.category,
                task.priority,
                task.notes,
                task.recurrence,
                task.recurrence_end
            );
        }
    }
}

/**
 * POST /tasks
 * Create a new task
 */
router.post('/', (req, res) => {
    try {
        const { title, due_date, scheduled_time, category, priority, notes, recurrence, recurrence_end } = req.body;

        if (!title || !due_date) {
            return res.status(400).json({ error: 'Title and due_date are required' });
        }

        db.prepare(`
      INSERT INTO tasks (user_id, title, due_date, scheduled_time, category, priority, notes, recurrence, recurrence_end) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            req.userId,
            title,
            due_date,
            scheduled_time || null,
            category || 'general',
            priority || 'medium',
            notes || null,
            recurrence || null,
            recurrence_end || null
        );

        // Get the task we just created
        const task = db.prepare(`
      SELECT * FROM tasks 
      WHERE user_id = ? AND title = ? AND due_date = ? AND deleted_at IS NULL
      ORDER BY id DESC LIMIT 1
    `).get(req.userId, title, due_date);

        res.status(201).json({ task });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /tasks/:id
 * Update task (toggle completion status or edit)
 * Per SECURITY.md: includes user_id filter (IDOR protection)
 */
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { title, status, scheduled_time, category, priority, notes } = req.body;

        // First verify ownership per SECURITY.md
        const existing = db.prepare(
            'SELECT id FROM tasks WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
        ).get(id, req.userId);

        if (!existing) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Build dynamic update
        const updates = [];
        const values = [];

        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
        }

        if (scheduled_time !== undefined) {
            updates.push('scheduled_time = ?');
            values.push(scheduled_time);
        }

        if (category !== undefined) {
            updates.push('category = ?');
            values.push(category);
        }

        if (priority !== undefined) {
            updates.push('priority = ?');
            values.push(priority);
        }

        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes);
        }

        if (status !== undefined) {
            if (!['todo', 'done'].includes(status)) {
                return res.status(400).json({ error: 'Status must be "todo" or "done"' });
            }
            updates.push('status = ?');
            values.push(status);

            // Set completed_at if marking as done
            if (status === 'done') {
                updates.push('completed_at = CURRENT_TIMESTAMP');
            } else {
                updates.push('completed_at = NULL');
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id, req.userId);
        db.prepare(`
      UPDATE tasks 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).run(...values);

        const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
        res.json({ task });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /tasks/:id
 * Soft delete per ASSUMPTIONS.md
 * Per SECURITY.md: includes user_id filter
 */
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;

        // First verify ownership per SECURITY.md
        const existing = db.prepare(
            'SELECT id FROM tasks WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
        ).get(id, req.userId);

        if (!existing) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Perform soft delete per ASSUMPTIONS.md
        db.prepare(`
          UPDATE tasks 
          SET deleted_at = CURRENT_TIMESTAMP 
          WHERE id = ? AND user_id = ?
        `).run(id, req.userId);

        res.json({ message: 'Task deleted' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
