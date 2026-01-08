import { db, initializeDatabase } from '../_db.js';
import { createSession, json, setSessionCookie } from '../_auth.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') {
        return json({});
    }

    await initializeDatabase();

    const { email, password } = await req.json();

    if (!email || !password) {
        return json({ error: 'Email and password are required' }, 400);
    }

    // Find user
    const result = await db.execute({
        sql: 'SELECT id, password_hash FROM users WHERE email = ?',
        args: [email],
    });

    if (result.rows.length === 0) {
        return json({ error: 'Invalid email or password' }, 401);
    }

    const user = result.rows[0];

    // Verify password
    const encoder = new TextEncoder();
    const data = encoder.encode(password + process.env.PASSWORD_SALT || 'default-salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (passwordHash !== user.password_hash) {
        return json({ error: 'Invalid email or password' }, 401);
    }

    // Create session
    const { token, expiresAt } = await createSession(user.id);

    return json(
        { message: 'Login successful', userId: user.id },
        200,
        { 'Set-Cookie': setSessionCookie(token, expiresAt) }
    );
}
