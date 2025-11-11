import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { businesses } from '@shared/schema';
import { and, eq } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth';
import { requireBusinessAccess } from '../middleware/business';

const router = Router();

// Business schema for validation
const businessSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  industry: z.string().min(1, 'Industry is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  logo_url: z.string().optional(),
});

// Get all businesses for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    // In a real app, you'd filter by the authenticated user's ID
    const allBusinesses = await db.select().from(businesses);
    res.json(allBusinesses);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ message: 'Failed to fetch businesses' });
  }
});

// Get a single business by ID
router.get('/:id', authenticateToken, requireBusinessAccess, async (req, res) => {
  try {
    const business = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, parseInt(req.params.id)))
      .limit(1);

    if (!business.length) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.json(business[0]);
  } catch (error) {
    console.error('Error fetching business:', error);
    res.status(500).json({ message: 'Failed to fetch business' });
  }
});

// Create a new business
router.post('/', authenticateToken, async (req, res) => {
  try {
    const validatedData = businessSchema.parse(req.body);
    
    const [newBusiness] = await db
      .insert(businesses)
      .values({
        ...validatedData,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    res.status(201).json(newBusiness);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors,
      });
    }
    console.error('Error creating business:', error);
    res.status(500).json({ message: 'Failed to create business' });
  }
});

// Update a business
router.put('/:id', authenticateToken, requireBusinessAccess, async (req, res) => {
  try {
    const validatedData = businessSchema.parse(req.body);
    
    const [updatedBusiness] = await db
      .update(businesses)
      .set({
        ...validatedData,
        updated_at: new Date(),
      })
      .where(eq(businesses.id, parseInt(req.params.id)))
      .returning();

    if (!updatedBusiness) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.json(updatedBusiness);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors,
      });
    }
    console.error('Error updating business:', error);
    res.status(500).json({ message: 'Failed to update business' });
  }
});

// Delete a business
router.delete('/:id', authenticateToken, requireBusinessAccess, async (req, res) => {
  try {
    const [deletedBusiness] = await db
      .delete(businesses)
      .where(eq(businesses.id, parseInt(req.params.id)))
      .returning();

    if (!deletedBusiness) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Error deleting business:', error);
    res.status(500).json({ message: 'Failed to delete business' });
  }
});

export default router;
