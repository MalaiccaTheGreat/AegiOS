import { Router } from 'express';
import { LaborManager } from '../../services/construction/laborManager';
import { authenticate, authorize } from '../../middleware/auth';
import { businessContext } from '../../middleware/businessContext';
import { z } from 'zod';

const router = Router();

// Apply authentication and business context to all routes
router.use(authenticate);
router.use(businessContext);

// Record time entry
router.post('/time-entries', async (req, res, next) => {
  try {
    const businessId = req.user?.businessId;
    const userId = req.user?.userId;
    
    if (!businessId || !userId) {
      return res.status(400).json({ message: 'Business context and user ID are required' });
    }

    // Validate request body
    const timeEntrySchema = z.object({
      employeeId: z.string().uuid(),
      projectId: z.string().uuid(),
      date: z.string().or(z.date()),
      regularHours: z.number().min(0).max(24),
      overtimeHours: z.number().min(0).max(24).default(0),
      laborType: z.enum(['assembly', 'electrical', 'plumbing', 'finishing', 'other']),
      notes: z.string().optional()
    });

    const data = timeEntrySchema.parse({
      ...req.body,
      date: new Date(req.body.date)
    });

    // Create time entry
    const timeEntry = await LaborManager.recordTimeEntry({
      ...data,
      businessId,
      date: new Date(data.date)
    });

    res.status(201).json(timeEntry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors
      });
    }
    next(error);
  }
});

// Get labor report for a project
router.get('/projects/:projectId/report', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const businessId = req.user?.businessId;
    
    if (!businessId) {
      return res.status(400).json({ message: 'Business context is required' });
    }

    const { startDate, endDate, laborType } = req.query;
    
    const report = await LaborManager.getProjectLaborReport(projectId, businessId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      laborType: laborType as string | undefined
    });

    res.json(report);
  } catch (error) {
    next(error);
  }
});

// Approve time entry (admin/manager only)
router.post('/time-entries/:entryId/approve', authorize(['admin', 'project_manager']), async (req, res, next) => {
  try {
    const { entryId } = req.params;
    const businessId = req.user?.businessId;
    const approvedById = req.user?.userId;
    
    if (!businessId || !approvedById) {
      return res.status(400).json({ 
        message: 'Business context and user ID are required' 
      });
    }

    const updatedEntry = await LaborManager.approveTimeEntry(
      entryId,
      approvedById,
      businessId
    );

    res.json(updatedEntry);
  } catch (error) {
    next(error);
  }
});

// Get employee timesheet
router.get('/employees/:employeeId/timesheet', async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const businessId = req.user?.businessId;
    const { startDate, endDate } = req.query;
    
    if (!businessId) {
      return res.status(400).json({ message: 'Business context is required' });
    }

    // In a real implementation, this would fetch time entries for the employee
    // with filtering by date range
    const timesheet = [];
    
    res.json({ 
      employeeId,
      startDate,
      endDate,
      entries: timesheet,
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0
    });
  } catch (error) {
    next(error);
  }
});

// Get labor cost forecast
router.get('/projects/:projectId/forecast', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const businessId = req.user?.businessId;
    
    if (!businessId) {
      return res.status(400).json({ message: 'Business context is required' });
    }

    // In a real implementation, this would calculate forecasted labor costs
    // based on project schedule, employee assignments, and historical data
    const forecast = {
      projectId,
      forecastedLaborCost: 0,
      forecastedHours: 0,
      remainingBudget: 0,
      estimatedCompletion: new Date(),
      riskLevel: 'low' // low, medium, high
    };
    
    res.json(forecast);
  } catch (error) {
    next(error);
  }
});

export default router;
