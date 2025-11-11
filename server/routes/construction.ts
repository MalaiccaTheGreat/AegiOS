import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';
import { db } from '../db.js';
import { projects, timeEntries, materials, subcontractors } from '../../shared/schema.js';
import { and, eq, sql } from 'drizzle-orm';

const router = Router();

// Project progress tracking
router.get('/projects/:id/progress', authenticate, async (req, res) => {
  try {
    const project = await db.query.projects.findFirst({
      where: (projects, { eq }) => eq(projects.id, parseInt(req.params.id)),
      with: {
        timeEntries: true,
        materials: true,
      },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Calculate progress metrics
    const totalHours = project.timeEntries.reduce(
      (sum, entry) => sum + (entry.hours || 0),
      0
    );

    const materialCost = project.materials.reduce(
      (sum, material) => sum + (material.cost || 0) * (material.quantity || 0),
      0
    );

    res.json({
      projectId: project.id,
      totalHours,
      materialCost,
      progress: project.progress || 0,
      lastUpdated: project.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching project progress:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Labor efficiency analytics
router.get('/projects/:id/labor-efficiency', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const efficiencyData = await db.query.timeEntries.findMany({
      where: (timeEntries, { eq }) => eq(timeEntries.projectId, parseInt(id)),
      with: {
        employee: true,
      },
    });

    // Group by employee and calculate efficiency metrics
    const employeeEfficiency = efficiencyData.reduce((acc, entry) => {
      const employeeId = entry.employeeId;
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employee: entry.employee,
          totalHours: 0,
          productiveHours: entry.hours * (entry.efficiencyRating || 1),
          totalEntries: 1,
        };
      } else {
        acc[employeeId].totalHours += entry.hours || 0;
        acc[employeeId].productiveHours += entry.hours * (entry.efficiencyRating || 1);
        acc[employeeId].totalEntries += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    // Calculate efficiency percentage
    const result = Object.values(employeeEfficiency).map((emp: any) => ({
      ...emp,
      efficiency: (emp.productiveHours / emp.totalHours) * 100,
    }));

    res.json(result);
  } catch (error) {
    console.error('Error calculating labor efficiency:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Material and subcontractor tracking
const materialSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  quantity: z.number().min(1),
  unit: z.string(),
  cost: z.number().min(0),
  projectId: z.number(),
});

router.post('/materials', authenticate, async (req, res) => {
  try {
    const data = materialSchema.parse(req.body);
    const [material] = await db.insert(materials).values(data).returning();
    res.status(201).json(material);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Error adding material:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
