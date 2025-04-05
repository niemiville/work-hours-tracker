import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

const SECRET_KEY = process.env.JWT_SECRET || 'fallback_for_development_only';

interface AuthRequest extends Request {
    user?: { id: number; name: string };
}

interface User {
    id: number;
    name: string;
    displayname: string;
    password: string;
}

// 🔹 User Signup
export const signup = async (req: Request, res: Response): Promise<any> => {
    const { name, password, displayname } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (name, password, displayname) VALUES ($1, $2, $3) RETURNING id, name, displayname',
            [name, hashedPassword, displayname]
        );
        return res.status(201).json(result.rows[0]);
    } catch (err) {
        return res.status(500).json({ error: 'Database error' });
    }
};

// 🔹 User Login
export const login = async (req: Request, res: Response): Promise<any> => {
    const { name, password, rememberMe } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE name = $1', [name]);
        if (result.rowCount === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user: User = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Set token expiration based on rememberMe flag
        const expiresIn = rememberMe ? '30d' : '1h';
        const token = jwt.sign(
            { id: user.id, name: user.name, displayname: user.displayname }, 
            SECRET_KEY, 
            { expiresIn }
        );
        
        return res.json({ 
            token, 
            user: { id: user.id, name: user.name, displayname: user.displayname },
            expiresIn
        });
    } catch (err) {
        return res.status(500).json({ error: 'Database error' });
    }
};

// 🔹 Middleware to Verify JWT Token
export const authenticate = (req: Request, res: Response, next: NextFunction): any => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }

    try {
        const verified = jwt.verify(token, SECRET_KEY);
        (req as any).user = verified;
        next();
    } catch (err) {
        return res.status(400).json({ error: 'Invalid token' });
    }
};

// 🔹 Get User
export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        res.json(req.user);
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve user" });
    }
};