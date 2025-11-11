import { and, between, eq, gte, lte, sql, sum } from 'drizzle-orm';
import { db } from '../db';
import { employees, timeEntries } from '../../shared/schema.js';

type PayrollPeriod = {
  startDate: Date;
  endDate: Date;
};

type PayrollCalculationResult = {
  employeeId: number;
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
  laborByType: Record<string, { hours: number; cost: number }>;
};

export class PayrollService {
  /**
   * Calculate payroll for a specific employee and time period
   */
  async calculateEmployeePayroll(
    employeeId: number,
    period: PayrollPeriod,
    businessId: number
  ): Promise<PayrollCalculationResult> {
    // Get employee details
    const [employee] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.id, employeeId), eq(employees.business_id, businessId)));

    if (!employee) {
      throw new Error('Employee not found or not authorized');
    }

    // Get time entries for the period
    const timeEntriesResult = await db
      .select({
        hours: sql<number>`COALESCE(time_entries.regular_hours, 0) + COALESCE(time_entries.overtime_hours, 0)`,
        regularHours: sql<number>`COALESCE(time_entries.regular_hours, 0)`,
        overtimeHours: sql<number>`COALESCE(time_entries.overtime_hours, 0)`,
        laborType: timeEntries.laborType,
      })
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employeeId, employeeId),
          eq(timeEntries.business_id, businessId),
          between(timeEntries.date, period.startDate, period.endDate)
        )
      );

    // Calculate total hours and group by labor type
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;
    const laborByType: Record<string, { hours: number; cost: number }> = {};

    for (const entry of timeEntriesResult) {
      const laborType = entry.laborType || 'other';
      const hours = parseFloat(entry.hours.toString());
      const regularHours = parseFloat(entry.regularHours?.toString() || '0');
      const overtimeHours = parseFloat(entry.overtimeHours?.toString() || '0');

      // Update labor type tracking
      if (!laborByType[laborType]) {
        laborByType[laborType] = { hours: 0, cost: 0 };
      }
      laborByType[laborType].hours += hours;
      laborByType[laborType].cost += regularHours * parseFloat(employee.hourlyRate || '0') +
                                    overtimeHours * parseFloat(employee.hourlyRate || '0') * 1.5;

      // Update totals
      totalRegularHours += regularHours;
      totalOvertimeHours += overtimeHours;
    }

    // Calculate pay
    const regularPay = totalRegularHours * parseFloat(employee.hourlyRate || '0');
    const overtimePay = totalOvertimeHours * parseFloat(employee.hourlyRate || '0') * 1.5;
    const totalPay = regularPay + overtimePay;

    return {
      employeeId,
      regularHours: parseFloat(totalRegularHours.toFixed(2)),
      overtimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
      regularPay: parseFloat(regularPay.toFixed(2)),
      overtimePay: parseFloat(overtimePay.toFixed(2)),
      totalPay: parseFloat(totalPay.toFixed(2)),
      laborByType,
    };
  }

  /**
   * Calculate project labor costs for a specific time period
   */
  async calculateProjectLaborCosts(
    projectId: number,
    period: PayrollPeriod,
    businessId: number
  ) {
    // Get time entries for the project and period
    const timeEntriesResult = await db
      .select({
        employeeId: timeEntries.employeeId,
        employeeName: employees.name,
        date: timeEntries.date,
        description: timeEntries.description,
        regularHours: timeEntries.regularHours,
        overtimeHours: timeEntries.overtimeHours,
        laborType: timeEntries.laborType,
        hourlyRate: employees.hourlyRate,
      })
      .from(timeEntries)
      .leftJoin(employees, eq(timeEntries.employeeId, employees.id))
      .where(
        and(
          eq(timeEntries.projectId, projectId),
          eq(timeEntries.business_id, businessId),
          between(timeEntries.date, period.startDate, period.endDate)
        )
      )
      .orderBy(timeEntries.date);

    // Calculate costs
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;
    let totalCost = 0;
    const laborByType: Record<string, { hours: number; cost: number }> = {};
    const laborByEmployee: Record<number, { name: string; hours: number; cost: number }> = {};

    for (const entry of timeEntriesResult) {
      const laborType = entry.laborType || 'other';
      const regularHours = parseFloat(entry.regularHours?.toString() || '0');
      const overtimeHours = parseFloat(entry.overtimeHours?.toString() || '0');
      const hours = regularHours + overtimeHours;
      const hourlyRate = parseFloat(entry.hourlyRate?.toString() || '0');
      const cost = regularHours * hourlyRate + overtimeHours * hourlyRate * 1.5;

      // Update labor type tracking
      if (!laborByType[laborType]) {
        laborByType[laborType] = { hours: 0, cost: 0 };
      }
      laborByType[laborType].hours += hours;
      laborByType[laborType].cost += cost;

      // Update employee tracking
      if (!laborByEmployee[entry.employeeId]) {
        laborByEmployee[entry.employeeId] = { 
          name: entry.employeeName || 'Unknown',
          hours: 0,
          cost: 0 
        };
      }
      laborByEmployee[entry.employeeId].hours += hours;
      laborByEmployee[entry.employeeId].cost += cost;

      // Update totals
      totalRegularHours += regularHours;
      totalOvertimeHours += overtimeHours;
      totalCost += cost;
    }

    return {
      projectId,
      period,
      totalRegularHours: parseFloat(totalRegularHours.toFixed(2)),
      totalOvertimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
      totalHours: parseFloat((totalRegularHours + totalOvertimeHours).toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      laborByType,
      laborByEmployee: Object.entries(laborByEmployee).map(([employeeId, data]) => ({
        employeeId: parseInt(employeeId),
        employeeName: data.name,
        hours: parseFloat(data.hours.toFixed(2)),
        cost: parseFloat(data.cost.toFixed(2)),
      })),
      timeEntries: timeEntriesResult.map(entry => ({
        ...entry,
        regularHours: parseFloat(entry.regularHours?.toString() || '0'),
        overtimeHours: parseFloat(entry.overtimeHours?.toString() || '0'),
        hourlyRate: parseFloat(entry.hourlyRate?.toString() || '0'),
      })),
    };
  }
}

export const payrollService = new PayrollService();
