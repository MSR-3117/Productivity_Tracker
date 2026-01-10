import { db, initializeDatabase } from './_db.js';
import { validateSession, getSessionToken, json } from './_auth.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') {
        return json({});
    }

    await initializeDatabase();

    // Validate session
    const token = getSessionToken(req);
    const session = await validateSession(token);
    if (!session) {
        return json({ error: 'Unauthorized' }, 401);
    }

    const userId = session.userId;
    const url = new URL(req.url);

    if (req.method === 'GET') {
        const date = url.searchParams.get('date');
        if (!date) {
            return json({ error: 'Date parameter is required' }, 400);
        }

        const tasks = await db.execute({
            sql: `SELECT id, title, status, due_date, scheduled_time, category, priority, notes, recurrence, completed_at, created_at
            FROM tasks WHERE user_id = ? AND due_date = ? AND deleted_at IS NULL
            ORDER BY scheduled_time ASC, created_at ASC`,
            args: [userId, date],
        });

        return json({ tasks: tasks.rows });
    }

    if (req.method === 'POST') {
        const { title, due_date, scheduled_time, category, priority, notes, recurrence } = await req.json();

        if (!title || !due_date) {
            return json({ error: 'Title and due_date are required' }, 400);
        }

        const result = await db.execute({
            sql: `INSERT INTO tasks (user_id, title, due_date, scheduled_time, category, priority, notes, recurrence)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [userId, title, due_date, scheduled_time || null, category || 'general', priority || 'medium', notes || null, recurrence || null],
        });

        const task = await db.execute({
            sql: 'SELECT * FROM tasks WHERE id = ?',
            args: [result.lastInsertRowid],
        });

        return json({ task: task.rows[0] }, 201);
    }

    return json({ error: 'Method not allowed' }, 405);
}
