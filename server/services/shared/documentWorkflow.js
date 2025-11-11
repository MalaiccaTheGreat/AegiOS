const { Workflow, WorkflowStep, Document, DocumentWorkflow, User, sequelize, Op } = require('../../models');
const notificationService = require('./notificationService');
const documentSigning = require('./documentSigning');

class DocumentWorkflowService {
  async createWorkflow({ name, description, steps, createdById }) {
    const transaction = await sequelize.transaction();
    
    try {
      // Create workflow
      const workflow = await Workflow.create({
        name,
        description,
        createdById,
        status: 'active',
      }, { transaction });

      // Create workflow steps
      const workflowSteps = [];
      for (const [index, step] of steps.entries()) {
        const workflowStep = await WorkflowStep.create({
          workflowId: workflow.id,
          name: step.name,
          description: step.description,
          stepType: step.stepType, // review, approve, sign, notify, etc.
          order: index + 1,
          assigneeType: step.assigneeType, // user, role, specific_user, etc.
          assigneeId: step.assigneeId, // user ID, role ID, etc.
          isRequired: step.isRequired !== false, // default to true
          config: step.config || {},
        }, { transaction });
        
        workflowSteps.push(workflowStep);
      }

      await transaction.commit();
      return { ...workflow.toJSON(), steps: workflowSteps };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async startWorkflowForDocument({ workflowId, documentId, startedById }) {
    const transaction = await sequelize.transaction();
    
    try {
      // Verify workflow exists and is active
      const workflow = await Workflow.findByPk(workflowId, {
        include: [
          {
            model: WorkflowStep,
            as: 'steps',
            order: [['order', 'ASC']],
          },
        ],
        transaction,
      });

      if (!workflow || workflow.status !== 'active') {
        throw new Error('Workflow not found or inactive');
      }

      // Verify document exists
      const document = await Document.findByPk(documentId, { transaction });
      if (!document) {
        throw new Error('Document not found');
      }

      // Create document workflow
      const documentWorkflow = await DocumentWorkflow.create({
        workflowId,
        documentId,
        startedById,
        status: 'in_progress',
        currentStep: 1,
      }, { transaction });

      // Start first step
      await this.startWorkflowStep(documentWorkflow, workflow.steps[0], transaction);

      await transaction.commit();
      return documentWorkflow;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async startWorkflowStep(documentWorkflow, step, transaction) {
    // Update document workflow with current step
    await documentWorkflow.update({
      currentStep: step.order,
      status: 'in_progress',
      currentStepStartedAt: new Date(),
    }, { transaction });

    // Get assignee(s) for this step
    const assignees = await this.getStepAssignees(step);

    // Perform step action based on step type
    switch (step.stepType) {
      case 'review':
        await this.startReviewStep(documentWorkflow, step, assignees, transaction);
        break;
      case 'approve':
        await this.startApprovalStep(documentWorkflow, step, assignees, transaction);
        break;
      case 'sign':
        await this.startSigningStep(documentWorkflow, step, assignees, transaction);
        break;
      case 'notify':
        await this.startNotificationStep(documentWorkflow, step, assignees, transaction);
        break;
      default:
        throw new Error(`Unsupported step type: ${step.stepType}`);
    }
  }

  async completeWorkflowStep({ documentWorkflowId, stepId, userId, action, comment = '' }) {
    const transaction = await sequelize.transaction();
    
    try {
      // Get document workflow and current step
      const documentWorkflow = await DocumentWorkflow.findByPk(documentWorkflowId, {
        include: [
          {
            model: Workflow,
            include: [
              {
                model: WorkflowStep,
                as: 'steps',
                order: [['order', 'ASC']],
              },
            ],
          },
          { model: Document },
        ],
        transaction,
      });

      if (!documentWorkflow) {
        throw new Error('Document workflow not found');
      }

      const currentStep = documentWorkflow.Workflow.steps.find(
        step => step.order === documentWorkflow.currentStep
      );

      if (!currentStep || currentStep.id !== stepId) {
        throw new Error('Invalid workflow step');
      }

      // Record step completion
      await documentWorkflow.createWorkflowStepHistory({
        workflowStepId: currentStep.id,
        action,
        comment,
        performedById: userId,
        status: action === 'approve' ? 'completed' : 'rejected',
      }, { transaction });

      // Handle step completion based on action
      if (action === 'approve') {
        await this.handleStepApproval(documentWorkflow, currentStep, transaction);
      } else {
        await this.handleStepRejection(documentWorkflow, currentStep, transaction);
      }

      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async handleStepApproval(documentWorkflow, currentStep, transaction) {
    const workflow = documentWorkflow.Workflow;
    const nextStep = workflow.steps.find(step => step.order === currentStep.order + 1);

    if (nextStep) {
      // Move to next step
      await this.startWorkflowStep(documentWorkflow, nextStep, transaction);
    } else {
      // No more steps, workflow is complete
      await documentWorkflow.update({
        status: 'completed',
        completedAt: new Date(),
      }, { transaction });

      // Notify document owner
      await notificationService.sendNotification(documentWorkflow.startedById, {
        type: 'workflow_completed',
        title: 'Workflow Completed',
        message: `Workflow "${workflow.name}" has been completed for document "${documentWorkflow.Document.name}"`,
        data: {
          documentId: documentWorkflow.documentId,
          workflowId: workflow.id,
        },
      });
    }
  }

  async handleStepRejection(documentWorkflow, currentStep, transaction) {
    const workflow = documentWorkflow.Workflow;
    
    // Update workflow status
    await documentWorkflow.update({
      status: 'rejected',
      completedAt: new Date(),
    }, { transaction });

    // Notify document owner and previous approvers
    await notificationService.sendNotification(documentWorkflow.startedById, {
      type: 'workflow_rejected',
      title: 'Workflow Rejected',
      message: `Step "${currentStep.name}" was rejected in workflow "${workflow.name}" for document "${documentWorkflow.Document.name}"`,
      data: {
        documentId: documentWorkflow.documentId,
        workflowId: workflow.id,
        stepId: currentStep.id,
      },
    });
  }

  async startReviewStep(documentWorkflow, step, assignees, transaction) {
    // Notify assignees that they need to review the document
    for (const assignee of assignees) {
      await notificationService.sendNotification(assignee.id, {
        type: 'document_review_requested',
        title: 'Document Review Requested',
        message: `You have been asked to review "${documentWorkflow.Document.name}"`,
        data: {
          documentId: documentWorkflow.documentId,
          workflowId: documentWorkflow.workflowId,
          stepId: step.id,
          documentWorkflowId: documentWorkflow.id,
          reviewUrl: `${process.env.FRONTEND_URL}/documents/${documentWorkflow.documentId}/review/${step.id}`,
        },
        channels: ['email', 'in_app'],
      });
    }
  }

  async startApprovalStep(documentWorkflow, step, assignees, transaction) {
    // Similar to review but with approval-specific logic
    for (const assignee of assignees) {
      await notificationService.sendNotification(assignee.id, {
        type: 'document_approval_requested',
        title: 'Approval Required',
        message: `Your approval is required for "${documentWorkflow.Document.name}"`,
        data: {
          documentId: documentWorkflow.documentId,
          workflowId: documentWorkflow.workflowId,
          stepId: step.id,
          documentWorkflowId: documentWorkflow.id,
          approvalUrl: `${process.env.FRONTEND_URL}/documents/${documentWorkflow.documentId}/approve/${step.id}`,
        },
        channels: ['email', 'in_app'],
      });
    }
  }

  async startSigningStep(documentWorkflow, step, assignees, transaction) {
    // Use the document signing service to request signatures
    await documentSigning.requestSignature({
      documentId: documentWorkflow.documentId,
      requesterId: documentWorkflow.startedById,
      signers: assignees.map((assignee, index) => ({
        userId: assignee.id,
        order: index + 1,
      })),
      message: step.config.message || 'Please sign this document as part of the approval process',
    });
  }

  async startNotificationStep(documentWorkflow, step, assignees, transaction) {
    // Send notifications without requiring action
    for (const assignee of assignees) {
      await notificationService.sendNotification(assignee.id, {
        type: 'document_notification',
        title: step.config.title || 'Document Notification',
        message: step.config.message || `You have been notified about "${documentWorkflow.Document.name}"`,
        data: {
          documentId: documentWorkflow.documentId,
          documentUrl: `${process.env.FRONTEND_URL}/documents/${documentWorkflow.documentId}`,
        },
        channels: step.config.channels || ['email', 'in_app'],
      });
    }

    // Automatically complete notification steps
    await this.completeWorkflowStep({
      documentWorkflowId: documentWorkflow.id,
      stepId: step.id,
      userId: documentWorkflow.startedById,
      action: 'approve',
      comment: 'Notification sent',
    });
  }

  async getStepAssignees(step) {
    switch (step.assigneeType) {
      case 'user':
        // Return single user
        const user = await User.findByPk(step.assigneeId);
        return user ? [user] : [];
      
      case 'role':
        // Return all users with the specified role
        return await User.findAll({
          include: [{
            model: Role,
            where: { id: step.assigneeId },
            through: { attributes: [] },
          }],
        });
      
      case 'document_owner':
        // Return document owner (handled in the step method)
        return [];
      
      case 'workflow_starter':
        // Return workflow starter (handled in the step method)
        return [];
      
      default:
        return [];
    }
  }

  async getDocumentWorkflowStatus(documentId) {
    const documentWorkflow = await DocumentWorkflow.findOne({
      where: { documentId },
      include: [
        {
          model: Workflow,
          include: [
            {
              model: WorkflowStep,
              as: 'steps',
              include: [
                {
                  model: WorkflowStepHistory,
                  as: 'history',
                  include: [{ model: User, as: 'performedBy' }],
                },
              ],
            },
          ],
        },
        { model: Document },
      ],
      order: [
        [Workflow, 'steps', 'order', 'ASC'],
        [Workflow, 'steps', 'history', 'createdAt', 'DESC'],
      ],
    });

    if (!documentWorkflow) {
      return null;
    }

    return documentWorkflow;
  }
}

module.exports = new DocumentWorkflowService();
