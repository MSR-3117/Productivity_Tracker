import { deleteSession, getSessionToken, json, clearSessionCookie } from '../_auth.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') {
        return json({});
    }

    const token = getSessionToken(req);
    if (token) {
        await deleteSession(token);
    }

    return json(
        { message: 'Logged out successfully' },
        200,
        { 'Set-Cookie': clearSessionCookie() }
    );
}
