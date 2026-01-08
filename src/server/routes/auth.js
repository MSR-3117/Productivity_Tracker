const express = require('express');
const argon2 = require('argon2');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { db } = require('../../db');

const router = express.Router();

/**
 * Rate limiter for auth endpoints
 * Prevents brute-force attacks per SECURITY.md
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { error: 'Too many attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter rate limiter for registration
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour per IP
    message: { error: 'Too many accounts created. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Input validation middleware
 */
const validateRegister = [
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email format'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/[A-Za-z]/)
        .withMessage('Password must contain at least one letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number'),
];

const validateLogin = [
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email format'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
];

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
 * POST /auth/register
 * Create new user with Argon2id hashed password
 * Rate limited: 3 attempts per hour per IP
 */
router.post('/register', registerLimiter, validateRegister, handleValidationErrors, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password with Argon2id per SECURITY.md
        const passwordHash = await argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 65536, // 64 MB
            timeCost: 3,
            parallelism: 4,
        });

        // Create user
        const result = db.prepare(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)'
        ).run(email, passwordHash);

        // Establish session
        req.session.userId = result.lastInsertRowid;

        res.status(201).json({
            message: 'User created successfully',
            userId: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /auth/login
 * Validate credentials and establish session
 * Rate limited: 5 attempts per 15 minutes per IP
 */
router.post('/login', authLimiter, validateLogin, handleValidationErrors, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = db.prepare('SELECT id, password_hash FROM users WHERE email = ?').get(email);
        if (!user) {
            // Use same error message to prevent user enumeration
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const valid = await argon2.verify(user.password_hash, password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Establish session
        req.session.userId = user.id;

        res.json({ message: 'Login successful', userId: user.id });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /auth/logout
 * Destroy session
 */
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

module.exports = router;
