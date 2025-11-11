import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AuthService } from '../services/core/authService';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    businessId: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header or cookie
    let token = req.headers.authorization?.split(' ')[1] || req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    const decoded = await AuthService.verifyToken(token);
    
    // Attach user to request
    req.user = {
      userId: decoded.userId,
      businessId: decoded.businessId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorize = (roles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'You do not have permission to perform this action' 
      });
    }

    next();
  };
};

export const verifyToken = (token: string) => {
  return new Promise((resolve, reject) => {
    verify(token, env.JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return reject(new Error('Invalid or expired token'));
      }
      resolve(decoded);
    });
  });
};

export const businessContext = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get business ID from header, query param, or body
    const businessId = 
      req.headers['x-business-id'] ||
      req.query.businessId ||
      req.body.businessId;

    if (!businessId) {
      return res.status(400).json({ message: 'Business ID is required' });
    }

    // Verify user has access to this business
    // This would typically check a user_businesses table
    // For now, we'll just attach it to the request
    req.user.businessId = businessId as string;
    
    next();
  } catch (error) {
    logger.error('Business context error:', error);
    return res.status(500).json({ message: 'Failed to set business context' });
  }
};
