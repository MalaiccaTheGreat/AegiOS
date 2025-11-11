import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { businesses } from '@shared/schema';
import { and, eq } from 'drizzle-orm';

/**
 * Middleware to check if the user has access to the requested business
 */
export const requireBusinessAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const businessId = parseInt(req.params.id || req.params.businessId || req.body.businessId);
    
    if (isNaN(businessId)) {
      return res.status(400).json({ message: 'Invalid business ID' });
    }

    // In a real app, you'd check if the current user has access to this business
    // For now, we'll just check if the business exists
    const business = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!business.length) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Attach business to request for use in subsequent middleware/route handlers
    (req as any).business = business[0];
    next();
  } catch (error) {
    console.error('Business access check failed:', error);
    res.status(500).json({ message: 'Failed to verify business access' });
  }
};

/**
 * Middleware to filter data by business ID
 */
export const filterByBusiness = (req: Request, res: Response, next: NextFunction) => {
  const businessId = req.query.businessId || (req.user && (req.user as any).businessId);
  
  if (!businessId) {
    return res.status(400).json({ message: 'Business ID is required' });
  }

  // Attach businessId to the request for use in route handlers
  (req as any).businessId = businessId;
  next();
};

/**
 * Middleware to set default business if not specified
 */
export const withDefaultBusiness = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // If no business ID is provided, try to get the user's default business
    if (!req.query.businessId && req.user) {
      // In a real app, you'd fetch the user's default business from the database
      // For now, we'll just get the first business for the user
      const userBusinesses = await db
        .select()
        .from(businesses)
        // Add user filter here when user authentication is implemented
        .limit(1);

      if (userBusinesses.length > 0) {
        (req as any).businessId = userBusinesses[0].id;
      }
    }
    
    next();
  } catch (error) {
    console.error('Failed to set default business:', error);
    next(); // Continue anyway, let individual routes handle missing business ID
  }
};
