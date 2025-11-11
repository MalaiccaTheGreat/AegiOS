import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your-secret-key';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // In a real app, you would check against your admin database
    // This is a simplified example
    if (email !== ADMIN_EMAIL) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // In a real app, you would verify the hashed password
    // For demo purposes, we're using a simple check
    const isPasswordValid = await bcrypt.compare(password, await bcrypt.hash('admin123', 10));
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: 'admin-1', 
        email: ADMIN_EMAIL,
        role: 'super-admin',
        permissions: ['*']
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: 'admin-1',
        email: ADMIN_EMAIL,
        name: 'Admin User',
        role: 'super-admin',
        permissions: ['*']
      },
      token
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCurrentAdmin = async (req: Request, res: Response) => {
  try {
    // The admin data should be attached by the auth middleware
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    res.json({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name || 'Admin User',
      role: req.user.role || 'admin',
      permissions: req.user.permissions || []
    });
  } catch (error) {
    console.error('Get current admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    // In a real app, add pagination and filtering
    const allUsers = await db.select().from(users);
    
    res.json(allUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to verify admin token
export const verifyAdminToken = (req: any, res: Response, next: Function) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
