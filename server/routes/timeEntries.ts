import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { timeEntries } from '../../shared/schema.js';
import { and, eq } from 'drizzle-orm';

const router = Router();

// Schema for time entry validation
const timeEntrySchema = z.object({
  businessId: z.number(),
  employeeId: z.number(),
  projectId: z.number().nullable().optional(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  description: z.string().min(1, 'Description is required'),
  laborType: z.enum(['assembly', 'electrical', 'plumbing', 'carpentry', 'masonry', 'painting', 'roofing', 'other']),
  isOvertime: z.boolean().default(false),
  regularHours: z.number().min(0),
  overtimeHours: z.number().min(0),
});

// Create a new time entry
router.post('/', async (req, res) => {
  try {
    const timeEntryData = timeEntrySchema.parse(req.body);
    
    const [newEntry] = await db
      .insert(timeEntries)
      .values({
        business_id: timeEntryData.businessId,
        employee_id: timeEntryData.employeeId,
        project_id: timeEntryData.projectId || null,
        date: new Date(timeEntryData.date),
        start_time: timeEntryData.startTime,
        end_time: timeEntryData.endTime,
        description: timeEntryData.description,
        labor_type: timeEntryData.laborType,
        is_overtime: timeEntryData.isOvertime,
        regular_hours: timeEntryData.regularHours,
        overtime_hours: timeEntryData.overtimeHours,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error creating time entry:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors,
      });
    }
    res.status(500).json({ message: 'Failed to create time entry' });
  }
});

// Get time entries for an employee
router.get('/', async (req, res) => {
  try {
    const { employeeId, businessId, startDate, endDate } = req.query;
    
    if (!employeeId || !businessId) {
      return res.status(400).json({ message: 'Employee ID and Business ID are required' });
    }

    let query = db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employee_id, Number(employeeId)),
          eq(timeEntries.business_id, Number(businessId))
        )
      )
      .orderBy(timeEntries.date);

    if (startDate && endDate) {
      query = query.where(
        and(
          gte(timeEntries.date, new Date(startDate as string)),
          lte(timeEntries.date, new Date(endDate as string))
        )
      );
    }

    const entries = await query;
    res.json(entries);
  } catch (error) {
    console.error('Error fetching time entries:', error);
    res.status(500).json({ message: 'Failed to fetch time entries' });
  }
});

// Update a time entry
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = timeEntrySchema.partial().parse(req.body);
    
    const [updatedEntry] = await db
      .update(timeEntries)
      .set({
        ...updateData,
        updated_at: new Date(),
      })
      .where(
        and(
          eq(timeEntries.id, Number(id)),
          eq(timeEntries.business_id, updateData.businessId!)
        )
      )
      .returning();

    if (!updatedEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    res.json(updatedEntry);
  } catch (error) {
    console.error('Error updating time entry:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors,
      });
    }
    res.status(500).json({ message: 'Failed to update time entry' });
  }
});

// Delete a time entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { businessId } = req.query;
    
    if (!businessId) {
      return res.status(400).json({ message: 'Business ID is required' });
    }

    const [deletedEntry] = await db
      .delete(timeEntries)
      .where(
        and(
          eq(timeEntries.id, Number(id)),
          eq(timeEntries.business_id, Number(businessId))
        )
      )
      .returning();

    if (!deletedEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    res.json({ message: 'Time entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    res.status(500).json({ message: 'Failed to delete time entry' });
  }
});

export default router;
