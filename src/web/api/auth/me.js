import { validateSession, getSessionToken, json } from '../_auth.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
    if (req.method === 'OPTIONS') {
        return json({});
    }

    const token = getSessionToken(req);
    const session = await validateSession(token);

    if (session) {
        return json({ authenticated: true, userId: session.userId });
    }

    return json({ authenticated: false }, 200);
}
