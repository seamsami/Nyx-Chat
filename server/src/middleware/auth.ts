import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { logger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        username: string;
      };
    }
  }
}

interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No authentication token provided'
      });
      return;
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Find user by ID
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      res.status(401).json({
        error: 'Access denied',
        message: 'User not found'
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        error: 'Access denied',
        message: 'Account is deactivated'
      });
      return;
    }

    // Add user info to request
    req.user = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token:', error.message);
      res.status(401).json({
        error: 'Access denied',
        message: 'Invalid authentication token'
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Expired JWT token');
      res.status(401).json({
        error: 'Access denied',
        message: 'Authentication token has expired'
      });
      return;
    }

    logger.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to authenticate token'
    });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without authentication
      next();
      return;
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Find user by ID
    const user = await User.findById(decoded.userId);
    
    if (user && user.isActive) {
      // Add user info to request if valid
      req.user = {
        userId: user._id.toString(),
        email: user.email,
        username: user.username
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't return errors, just continue without user
    logger.debug('Optional auth failed:', error instanceof Error ? error.message : 'Unknown error');
    next();
  }
};

export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          error: 'Access denied',
          message: 'Authentication required'
        });
        return;
      }

      const user = await User.findById(req.user.userId);
      
      if (!user) {
        res.status(401).json({
          error: 'Access denied',
          message: 'User not found'
        });
        return;
      }

      // For now, we'll implement a simple role system
      // In a real application, you might have a separate roles collection
      const userRole = user.email.endsWith('@admin.nyx') ? 'admin' : 'user';
      
      if (!roles.includes(userRole)) {
        res.status(403).json({
          error: 'Access forbidden',
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Role check error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to check user permissions'
      });
    }
  };
};

export const rateLimitByUser = (maxRequests: number, windowMs: number) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.user?.userId || req.ip;
    const now = Date.now();
    
    const userLimit = userRequests.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize user limit
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }

    if (userLimit.count >= maxRequests) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${Math.ceil((userLimit.resetTime - now) / 1000)} seconds.`
      });
      return;
    }

    userLimit.count++;
    next();
  };
};

export const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    // If no API key is configured, skip validation
    next();
    return;
  }

  if (!apiKey || apiKey !== validApiKey) {
    res.status(401).json({
      error: 'Invalid API key',
      message: 'A valid API key is required to access this endpoint'
    });
    return;
  }

  next();
};

export const requireVerifiedEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
      return;
    }

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      res.status(401).json({
        error: 'Access denied',
        message: 'User not found'
      });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({
        error: 'Email verification required',
        message: 'Please verify your email address to access this feature'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Email verification check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to check email verification status'
    });
  }
};

export const checkAccountLock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      next();
      return;
    }

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      res.status(401).json({
        error: 'Access denied',
        message: 'User not found'
      });
      return;
    }

    if (user.isLocked) {
      res.status(423).json({
        error: 'Account locked',
        message: 'Account is temporarily locked due to security reasons'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Account lock check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to check account status'
    });
  }
};