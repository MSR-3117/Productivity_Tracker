import { db, initializeDatabase } from './_db.js';
import { validateSession, getSessionToken, json } from './_auth.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') {
        return json({});
    }

    await initializeDatabase();

    const token = getSessionToken(req);
    const session = await validateSession(token);
    if (!session) {
        return json({ error: 'Unauthorized' }, 401);
    }

    const userId = session.userId;

    if (req.method === 'GET') {
        let settings = await db.execute({
            sql: 'SELECT * FROM user_settings WHERE user_id = ?',
            args: [userId],
        });

        if (settings.rows.length === 0) {
            await db.execute({
                sql: 'INSERT INTO user_settings (user_id, theme) VALUES (?, ?)',
                args: [userId, 'dark'],
            });
            return json({ settings: { user_id: userId, theme: 'dark' } });
        }

        return json({ settings: settings.rows[0] });
    }

    if (req.method === 'PUT') {
        const { theme } = await req.json();

        const existing = await db.execute({
            sql: 'SELECT user_id FROM user_settings WHERE user_id = ?',
            args: [userId],
        });

        if (existing.rows.length > 0) {
            await db.execute({
                sql: 'UPDATE user_settings SET theme = ? WHERE user_id = ?',
                args: [theme || 'dark', userId],
            });
        } else {
            await db.execute({
                sql: 'INSERT INTO user_settings (user_id, theme) VALUES (?, ?)',
                args: [userId, theme || 'dark'],
            });
        }

        const settings = await db.execute({
            sql: 'SELECT * FROM user_settings WHERE user_id = ?',
            args: [userId],
        });

        return json({ settings: settings.rows[0] });
    }

    return json({ error: 'Method not allowed' }, 405);
}
