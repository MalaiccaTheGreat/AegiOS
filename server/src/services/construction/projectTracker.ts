import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { projects, timeEntries, employees, clients } from '../../../shared/schema';
import { logger } from '../../utils/logger';

export class ProjectTracker {
  static async getProjectDashboard(projectId: string, businessId: string) {
    try {
      // Get project details
      const [project] = await db
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.id, projectId),
            eq(projects.businessId, businessId)
          )
        )
        .limit(1);

      if (!project) {
        throw new Error('Project not found');
      }

      // Get client details
      const [client] = project.clientId ? await db
        .select()
        .from(clients)
        .where(eq(clients.id, project.clientId))
        .limit(1) : [null];

      // Calculate labor statistics
      const laborStats = await db
        .select({
          totalHours: sql<number>`COALESCE(SUM(${timeEntries.regularHours} + ${timeEntries.overtimeHours}), 0)`,
          totalOvertime: sql<number>`COALESCE(SUM(${timeEntries.overtimeHours}), 0)`
        })
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.projectId, projectId),
            eq(timeEntries.businessId, businessId)
          )
        )
        .then(rows => rows[0] || { totalHours: 0, totalOvertime: 0 });

      // Calculate project progress
      const progress = await this.calculateProjectProgress(projectId, businessId);

      // Calculate financials
      const financials = await this.calculateProjectFinancials(projectId, businessId);

      // Get recent activities
      const recentActivities = await this.getRecentActivities(projectId, businessId);

      // Calculate project health score
      const healthScore = await this.calculateHealthScore(project, laborStats, financials);

      return {
        project: {
          ...project,
          client,
          progress,
          healthScore,
          laborStats,
          financials,
          recentActivities
        }
      };
    } catch (error) {
      logger.error('Failed to get project dashboard:', error);
      throw new Error('Failed to load project dashboard');
    }
  }

  private static async calculateProjectProgress(projectId: string, businessId: string) {
    // In a real implementation, this would calculate based on completed tasks/milestones
    // For now, we'll return a mock value
    return {
      percentage: 0,
      completedTasks: 0,
      totalTasks: 0,
      lastUpdated: new Date()
    };
  }

  private static async calculateProjectFinancials(projectId: string, businessId: string) {
    // In a real implementation, this would calculate actual financials
    // For now, we'll return mock data
    return {
      budget: 0,
      spent: 0,
      remaining: 0,
      laborCost: 0,
      materialCost: 0,
      otherCost: 0,
      profitMargin: 0
    };
  }

  private static async getRecentActivities(projectId: string, businessId: string) {
    // In a real implementation, this would fetch from an activities table
    return [];
  }

  private static async calculateHealthScore(project: any, laborStats: any, financials: any) {
    // Simple health score calculation (0-100)
    // In a real implementation, this would be more sophisticated
    let score = 80; // Base score
    
    // Adjust based on labor utilization
    if (laborStats.totalOvertime / laborStats.totalHours > 0.2) {
      score -= 10; // High overtime usage
    }

    // Adjust based on budget
    if (financials.spent > financials.budget * 0.9) {
      score -= 15; // Approaching budget limit
    }

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
  }

  static async updateProjectStatus(projectId: string, businessId: string, status: string) {
    try {
      const [updatedProject] = await db
        .update(projects)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(projects.id, projectId),
            eq(projects.businessId, businessId)
          )
        )
        .returning();

      return updatedProject;
    } catch (error) {
      logger.error('Failed to update project status:', error);
      throw new Error('Failed to update project status');
    }
  }

  static async getClientPortalData(projectId: string, clientId: string) {
    try {
      // Verify client has access to this project
      const [project] = await db
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.id, projectId),
            eq(projects.clientId, clientId)
          )
        )
        .limit(1);

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      // Get project progress
      const progress = await this.calculateProjectProgress(projectId, project.businessId);

      // Get recent updates (filtered for client view)
      const recentUpdates = await this.getRecentActivities(projectId, project.businessId);

      // Get project documents (placeholder)
      const documents = [];

      return {
        project: {
          ...project,
          progress,
          recentUpdates,
          documents
        }
      };
    } catch (error) {
      logger.error('Failed to get client portal data:', error);
      throw new Error('Failed to load client portal');
    }
  }
}
