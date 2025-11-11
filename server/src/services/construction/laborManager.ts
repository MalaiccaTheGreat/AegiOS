import { and, eq, gte, lte, between, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { timeEntries, employees, projects } from '../../../shared/schema';
import { logger } from '../../utils/logger';

const OVERTIME_THRESHOLD = 40; // Hours per week
const OVERTIME_RATE = 1.5;

export class LaborManager {
  static async recordTimeEntry(entry: {
    employeeId: string;
    projectId: string;
    businessId: string;
    date: Date;
    regularHours: number;
    overtimeHours: number;
    laborType: 'assembly' | 'electrical' | 'plumbing' | 'finishing' | 'other';
    notes?: string;
  }) {
    try {
      // Verify employee exists and is active
      const [employee] = await db
        .select()
        .from(employees)
        .where(
          and(
                }
            eq(employees.id, entry.employeeId),
            eq(employees.businessId, entry.businessId),
            eq(employees.status, 'active')
          )
        )
        .limit(1);

      if (!employee) {
        throw new Error('Employee not found or inactive');
      }

      // Verify project exists and is active
      const [project] = await db
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.id, entry.projectId),
            eq(projects.businessId, entry.businessId),
            eq(projects.status, 'active')
          )
        )
        .limit(1);

      if (!project) {
        throw new Error('Project not found or inactive');
      }

      // Calculate weekly hours to determine overtime
      const weekStart = this.getWeekStart(entry.date);
      const weekEnd = this.getWeekEnd(entry.date);

      const weeklyHours = await this.getEmployeeWeeklyHours(
        entry.employeeId,
        weekStart,
        weekEnd
      );

      // Calculate regular and overtime hours
      let regularHours = entry.regularHours;
      let overtimeHours = entry.overtimeHours;

      if (weeklyHours < OVERTIME_THRESHOLD) {
        const remainingRegular = OVERTIME_THRESHOLD - weeklyHours;
        if (regularHours > remainingRegular) {
          overtimeHours += regularHours - remainingRegular;
          regularHours = remainingRegular;
        }
      } else {
        // All hours are overtime if weekly threshold is already met
        overtimeHours += regularHours;
        regularHours = 0;
      }

      // Record the time entry
      const [newEntry] = await db
        .insert(timeEntries)
        .values({
          ...entry,
          regularHours,
          overtimeHours,
          totalHours: regularHours + overtimeHours,
          laborCost: this.calculateLaborCost(employee.hourlyRate, regularHours, overtimeHours),
          status: 'pending_approval',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Update project labor stats
      await this.updateProjectLaborStats(entry.projectId, entry.businessId);

      return newEntry;
    } catch (error) {
      logger.error('Failed to record time entry:', error);
      throw new Error('Failed to record time entry');
    }
  }

  static async getEmployeeWeeklyHours(employeeId: string, startDate: Date, endDate: Date) {
    const result = await db
      .select({
        totalHours: sql<number>`COALESCE(SUM(${timeEntries.regularHours} + ${timeEntries.overtimeHours}), 0)`
      })
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employeeId, employeeId),
          between(timeEntries.date, startDate, endDate),
          eq(timeEntries.status, 'approved')
        )
      )
      .groupBy(timeEntries.employeeId);

    return result[0]?.totalHours || 0;
  }

  static async getProjectLaborReport(projectId: string, businessId: string, options: {
    startDate?: Date;
    endDate?: Date;
    laborType?: string;
  } = {}) {
    try {
      const conditions = [
        eq(timeEntries.projectId, projectId),
        eq(timeEntries.businessId, businessId),
        eq(timeEntries.status, 'approved')
      ];

      if (options.startDate) {
        conditions.push(gte(timeEntries.date, options.startDate));
      }

      if (options.endDate) {
        conditions.push(lte(timeEntries.date, options.endDate));
      }

      if (options.laborType) {
        conditions.push(eq(timeEntries.laborType, options.laborType));
      }

      const entries = await db
        .select({
          id: timeEntries.id,
          date: timeEntries.date,
          employee: {
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            role: employees.role
          },
          regularHours: timeEntries.regularHours,
          overtimeHours: timeEntries.overtimeHours,
          totalHours: timeEntries.totalHours,
          laborType: timeEntries.laborType,
          laborCost: timeEntries.laborCost,
          notes: timeEntries.notes
        })
        .from(timeEntries)
        .innerJoin(employees, eq(timeEntries.employeeId, employees.id))
        .where(and(...conditions))
        .orderBy(timeEntries.date);

      // Calculate summary
      const summary = entries.reduce(
        (acc, entry) => ({
          totalRegularHours: acc.totalRegularHours + (entry.regularHours || 0),
          totalOvertimeHours: acc.totalOvertimeHours + (entry.overtimeHours || 0),
          totalLaborCost: acc.totalLaborCost + (entry.laborCost || 0),
          employeeCount: new Set([...acc.employeeCount, entry.employee.id]).size
        }),
        {
          totalRegularHours: 0,
          totalOvertimeHours: 0,
          totalLaborCost: 0,
          employeeCount: 0
        }
      );

      return {
        entries,
        summary: {
          ...summary,
          totalHours: summary.totalRegularHours + summary.totalOvertimeHours
        }
      };
    } catch (error) {
      logger.error('Failed to generate labor report:', error);
      throw new Error('Failed to generate labor report');
    }
  }

  static async approveTimeEntry(entryId: string, approvedById: string, businessId: string) {
    try {
      const [updatedEntry] = await db
        .update(timeEntries)
        .set({
          status: 'approved',
          approvedBy: approvedById,
          approvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(timeEntries.id, entryId),
            eq(timeEntries.businessId, businessId)
          )
        )
        .returning();

      if (!updatedEntry) {
        throw new Error('Time entry not found');
      }

      // Update project labor stats
      await this.updateProjectLaborStats(updatedEntry.projectId, businessId);

      return updatedEntry;
    } catch (error) {
      logger.error('Failed to approve time entry:', error);
      throw new Error('Failed to approve time entry');
    }
  }

  private static calculateLaborCost(hourlyRate: number, regularHours: number, overtimeHours: number): number {
    return (hourlyRate * regularHours) + (hourlyRate * OVERTIME_RATE * overtimeHours);
  }

  private static getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setUTCDate(diff));
  }

  private static getWeekEnd(date: Date): Date {
    const weekStart = this.getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    return weekEnd;
  }

  private static async updateProjectLaborStats(projectId: string, businessId: string) {
    try {
      const stats = await db
        .select({
          totalHours: sql<number>`COALESCE(SUM(${timeEntries.regularHours} + ${timeEntries.overtimeHours}), 0)`,
          totalCost: sql<number>`COALESCE(SUM(${timeEntries.laborCost}), 0)`
        })
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.projectId, projectId),
            eq(timeEntries.businessId, businessId),
            eq(timeEntries.status, 'approved')
          )
        )
        .then(rows => rows[0] || { totalHours: 0, totalCost: 0 });

      // Update project with new labor stats
      await db
        .update(projects)
        .set({
          totalLaborHours: stats.totalHours,
          totalLaborCost: stats.totalCost,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(projects.id, projectId),
            eq(projects.businessId, businessId)
          )
        );
    } catch (error) {
      logger.error('Failed to update project labor stats:', error);
      // Don't throw, as this is a non-critical background update
    }
  }
}
