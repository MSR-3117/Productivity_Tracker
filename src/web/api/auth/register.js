import { db, initializeDatabase } from '../_db.js';
import { createSession, json, setSessionCookie } from '../_auth.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') {
        return json({});
    }

    await initializeDatabase();

    const { email, password } = await req.json();

    if (!email || !password) {
        return json({ error: 'Email and password are required' }, 400);
    }

    if (password.length < 8) {
        return json({ error: 'Password must be at least 8 characters' }, 400);
    }

    // Check if user exists
    const existing = await db.execute({
        sql: 'SELECT id FROM users WHERE email = ?',
        args: [email],
    });

    if (existing.rows.length > 0) {
        return json({ error: 'Email already registered' }, 409);
    }

    // Hash password (simple hash for edge runtime - use bcrypt in Node runtime)
    const encoder = new TextEncoder();
    const data = encoder.encode(password + process.env.PASSWORD_SALT || 'default-salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Create user
    const result = await db.execute({
        sql: 'INSERT INTO users (email, password_hash) VALUES (?, ?)',
        args: [email, passwordHash],
    });

    const userId = Number(result.lastInsertRowid);

    // Create session
    const { token, expiresAt } = await createSession(userId);

    return json(
        { message: 'User created successfully', userId },
        201,
        { 'Set-Cookie': setSessionCookie(token, expiresAt) }
    );
}
