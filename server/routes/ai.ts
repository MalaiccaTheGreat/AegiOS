import { Router } from 'express';
import { AIOrchestrator } from '../services/aiOrchestrator';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';
import { db } from '../db';

const router = Router();

// Middleware to validate business access
const validateBusinessAccess = async (req: any, res: any, next: any) => {
  try {
    const { businessId } = req.params;
    // In a real app, verify the user has access to this business
    const business = await db.query.businesses.findFirst({
      where: (businesses, { eq }) => eq(businesses.id, parseInt(businessId))
    });
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    // Attach business to request for later use
    req.business = business;
    next();
  } catch (error) {
    console.error('Business access validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get AI insights for a business
router.get('/business/:businessId/insights', authenticateToken, validateBusinessAccess, async (req, res) => {
  try {
    const { businessId } = req.params;
    const insights = await AIOrchestrator.analyzeBusiness(parseInt(businessId));
    res.json(insights);
  } catch (error) {
    console.error('Error generating AI insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Get predictions for a specific metric
router.get('/predictions/:metric', authenticateToken, async (req, res) => {
  try {
    const { metric } = z.object({
      metric: z.enum(['revenue', 'workload', 'expenses'])
    }).parse(req.params);

    const { businessId } = z.object({
      businessId: z.string().transform(Number)
    }).parse(req.query);

    // In a real app, verify business access here
    const insights = await AIOrchestrator.analyzeBusiness(businessId);
    
    // Return different prediction types based on the metric
    switch (metric) {
      case 'revenue':
        return res.json({ predictions: insights.predictions.revenueForecast });
      case 'workload':
        return res.json({ predictions: insights.predictions.busyPeriods });
      default:
        return res.json({ predictions: [] });
    }
  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

// Get business health score
router.get('/business/:businessId/health', authenticateToken, validateBusinessAccess, async (req, res) => {
  try {
    const { businessId } = req.params;
    const insights = await AIOrchestrator.analyzeBusiness(parseInt(businessId));
    
    // Calculate a simple health score (0-100)
    let score = 75; // Base score
    
    // Adjust based on anomalies
    const anomalyImpact = insights.anomalies.reduce((sum, a) => {
      return sum + (a.impact === 'high' ? -15 : a.impact === 'medium' ? -5 : -2);
    }, 0);
    
    // Adjust based on recommendations (more recommendations might indicate more issues)
    const recommendationImpact = Math.min(-5 * insights.recommendations.length, -5);
    
    const finalScore = Math.max(0, Math.min(100, score + anomalyImpact + recommendationImpact));
    
    res.json({
      score: Math.round(finalScore),
      status: finalScore >= 70 ? 'healthy' : finalScore >= 40 ? 'needs_attention' : 'critical',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating business health:', error);
    res.status(500).json({ error: 'Failed to calculate business health' });
  }
});

export default router;
