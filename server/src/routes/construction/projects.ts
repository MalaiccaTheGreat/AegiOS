import { Router } from 'express';
import { ProjectTracker } from '../../services/construction/projectTracker';
import { authenticate, authorize } from '../../middleware/auth';
import { businessContext } from '../../middleware/businessContext';

const router = Router();

// Apply authentication and business context to all routes
router.use(authenticate);
router.use(businessContext);

// Get project dashboard
router.get('/:projectId/dashboard', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const businessId = req.user?.businessId;
    
    if (!businessId) {
      return res.status(400).json({ message: 'Business context is required' });
    }

    const dashboard = await ProjectTracker.getProjectDashboard(projectId, businessId);
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
});

// Update project status
router.patch('/:projectId/status', authorize(['admin', 'project_manager']), async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body;
    const businessId = req.user?.businessId;
    
    if (!businessId) {
      return res.status(400).json({ message: 'Business context is required' });
    }

    if (!['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updatedProject = await ProjectTracker.updateProjectStatus(projectId, businessId, status);
    res.json(updatedProject);
  } catch (error) {
    next(error);
  }
});

// Client portal endpoint (no authentication, uses client token)
router.get('/client/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const clientToken = req.headers['x-client-token'];
    
    if (!clientToken) {
      return res.status(401).json({ message: 'Client token is required' });
    }

    // In a real implementation, verify the client token
    // For now, we'll use a simple placeholder
    const clientId = 'extracted-from-token';
    
    const portalData = await ProjectTracker.getClientPortalData(projectId, clientId);
    res.json(portalData);
  } catch (error) {
    next(error);
  }
});
// Get project timeline
router.get('/:projectId/timeline', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const businessId = req.user?.businessId;
    
    if (!businessId) {
      return res.status(400).json({ message: 'Business context is required' });
    }

    // In a real implementation, this would fetch from a timeline/events table
    const timeline = [];
    
    res.json({ timeline });
  } catch (error) {
    next(error);
  }
});

// Upload project document
router.post('/:projectId/documents', authorize(['admin', 'project_manager']), async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const businessId = req.user?.businessId;
    
    if (!businessId) {
      return res.status(400).json({ message: 'Business context is required' });
    }

    // In a real implementation, this would handle file uploads
    // and save document metadata to the database
    
    res.status(201).json({ 
      message: 'Document uploaded successfully',
      document: {
        id: 'doc-123',
        name: req.body.name || 'document.pdf',
        type: req.body.type || 'pdf',
        size: req.body.size || 0,
        url: `/api/projects/${projectId}/documents/doc-123`
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
