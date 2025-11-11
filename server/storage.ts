import {
  services,
  employees,
  timeEntries,
  clients,
  quotations,
  quotationItems,
  invoices,
  invoiceItems,
  payrollRecords,
  emailTemplates,
  projects,
  type Service,
  type InsertService,
  type Employee,
  type InsertEmployee,
  type TimeEntry,
  type InsertTimeEntry,
  type Client,
  type InsertClient,
  type Quotation,
  type InsertQuotation,
  type QuotationItem,
  type InsertQuotationItem,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
  type PayrollRecord,
  type InsertPayrollRecord,
  type EmailTemplate,
  type InsertEmailTemplate,
  type Project,
  type InsertProject,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Business
  getBusinesses(): Promise<Business[]>;
  getBusiness(id: number): Promise<Business | undefined>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: number, business: Partial<InsertBusiness>): Promise<Business>;
  deleteBusiness(id: number): Promise<void>;

  // Services
  getServices(businessId: number): Promise<Service[]>;
  getService(id: number, businessId: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>, businessId: number): Promise<Service>;
  deleteService(id: number, businessId: number): Promise<void>;

  // Employees
  getEmployees(businessId: number): Promise<Employee[]>;
  getEmployee(id: number, businessId: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>, businessId: number): Promise<Employee>;
  deleteEmployee(id: number, businessId: number): Promise<void>;

  // Time Entries
  getTimeEntries(businessId: number): Promise<TimeEntry[]>;
  getTimeEntriesByEmployee(employeeId: number, businessId: number): Promise<TimeEntry[]>;
  getTimeEntriesByDateRange(startDate: string, endDate: string, businessId: number): Promise<TimeEntry[]>;
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: number, timeEntry: Partial<InsertTimeEntry>, businessId: number): Promise<TimeEntry>;
  deleteTimeEntry(id: number, businessId: number): Promise<void>;

  // Clients
  getClients(businessId: number): Promise<Client[]>;
  getClient(id: number, businessId: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>, businessId: number): Promise<Client>;
  deleteClient(id: number, businessId: number): Promise<void>;

  // Quotations
  getQuotations(businessId: number): Promise<Quotation[]>;
  getQuotation(id: number, businessId: number): Promise<Quotation | undefined>;
  getQuotationWithItems(id: number, businessId: number): Promise<(Quotation & { items: QuotationItem[] }) | undefined>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: number, quotation: Partial<InsertQuotation>, businessId: number): Promise<Quotation>;
  deleteQuotation(id: number, businessId: number): Promise<void>;

  // Quotation Items
  createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem>;
  getQuotationItems(quotationId: number): Promise<QuotationItem[]>;
  getAllQuotationItems(): Promise<QuotationItem[]>;
  deleteQuotationItems(quotationId: number): Promise<void>;

  // Invoices
  getInvoices(businessId: number): Promise<Invoice[]>;
  getInvoice(id: number, businessId: number): Promise<Invoice | undefined>;
  getInvoiceWithItems(id: number, businessId: number): Promise<(Invoice & { items: InvoiceItem[] }) | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>, businessId: number): Promise<Invoice>;
  deleteInvoice(id: number, businessId: number): Promise<void>;

  // Invoice Items
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  getAllInvoiceItems(): Promise<InvoiceItem[]>;
  deleteInvoiceItems(invoiceId: number): Promise<void>;

  // Payroll
  getPayrollRecords(businessId: number): Promise<PayrollRecord[]>;
  getPayrollRecordsByEmployee(employeeId: number, businessId: number): Promise<PayrollRecord[]>;
  getPayrollRecordsByMonth(month: number, year: number, businessId: number): Promise<PayrollRecord[]>;
  createPayrollRecord(payroll: InsertPayrollRecord): Promise<PayrollRecord>;
  updatePayrollRecord(id: number, payroll: Partial<InsertPayrollRecord>, businessId: number): Promise<PayrollRecord>;
  deletePayrollRecord(id: number, businessId: number): Promise<void>;

  // Email Templates
  getEmailTemplates(businessId: number): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number, businessId: number): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>, businessId: number): Promise<EmailTemplate>;
  deleteEmailTemplate(id: number, businessId: number): Promise<void>;

  // Projects
  getProjects(businessId: number): Promise<Project[]>;
  getProject(id: number, businessId: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>, businessId: number): Promise<Project>;
  deleteProject(id: number, businessId: number): Promise<void>;
  getProjectTimeEntries(projectId: number, businessId: number): Promise<TimeEntry[]>;
  getProjectInvoices(projectId: number, businessId: number): Promise<Invoice[]>;
  getProjectMetrics(projectId: number, businessId: number): Promise<{
    totalHours: number;
    totalInvoiced: number;
    remainingBudget: number;
    progress: number;
  }>;

  // Dashboard metrics
  getDashboardMetrics(businessId: number): Promise<{
    activeProjects: number;
    pendingQuotations: number;
    monthlyRevenue: number;
    teamHours: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Business methods
  async getBusinesses(): Promise<Business[]> {
    try {
      return await db.select().from(businesses);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      throw new Error('Failed to fetch businesses');
    }
  }

  async getBusiness(id: number): Promise<Business | undefined> {
    try {
      const result = await db.select().from(businesses).where(eq(businesses.id, id));
      return result[0];
    } catch (error) {
      console.error(`Error fetching business with id ${id}:`, error);
      throw new Error(`Failed to fetch business with id ${id}`);
    }
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    try {
      const result = await db.insert(businesses).values(business).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating business:', error);
      throw new Error('Failed to create business');
    }
  }

  async updateBusiness(id: number, business: Partial<InsertBusiness>): Promise<Business> {
    try {
      const result = await db
        .update(businesses)
        .set({ ...business, updated_at: new Date() })
        .where(eq(businesses.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error(`Error updating business with id ${id}:`, error);
      throw new Error(`Failed to update business with id ${id}`);
    }
  }

  async deleteBusiness(id: number): Promise<void> {
    try {
      await db.delete(businesses).where(eq(businesses.id, id));
    } catch (error) {
      console.error(`Error deleting business with id ${id}:`, error);
      throw new Error(`Failed to delete business with id ${id}`);
    }
  }

  // Service methods
  // Services
  async getServices(businessId: number): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.business_id, businessId))
      .orderBy(desc(services.created_at));
  }

  async getService(id: number, businessId: number): Promise<Service | undefined> {
    const [service] = await db
      .select()
      .from(services)
      .where(and(eq(services.id, id), eq(services.business_id, businessId)));
    return service || undefined;
  }

  async createService(service: InsertService): Promise<Service> {
    const [created] = await db.insert(services).values(service).returning();
    return created;
  }

  async updateService(id: number, service: Partial<InsertService>, businessId: number): Promise<Service> {
    const [updated] = await db
      .update(services)
      .set({ ...service, updated_at: new Date() })
      .where(and(eq(services.id, id), eq(services.business_id, businessId)))
      .returning();
    if (!updated) {
      throw new Error('Service not found or not authorized');
    }
    return updated;
  }

  async deleteService(id: number, businessId: number): Promise<void> {
    const result = await db
      .delete(services)
      .where(and(eq(services.id, id), eq(services.business_id, businessId)));
    if (result.rowCount === 0) {
      throw new Error('Service not found or not authorized');
    }
  }

  // Employees
  async getEmployees(businessId: number): Promise<Employee[]> {
    return await db
      .select()
      .from(employees)
      .where(eq(employees.business_id, businessId))
      .orderBy(desc(employees.created_at));
  }

  async getEmployee(id: number, businessId: number): Promise<Employee | undefined> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(and(eq(employees.id, id), eq(employees.business_id, businessId)));
    return employee || undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [created] = await db.insert(employees).values(employee).returning();
    return created;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>, businessId: number): Promise<Employee> {
    const [updated] = await db
      .update(employees)
      .set({ ...employee, updated_at: new Date() })
      .where(and(eq(employees.id, id), eq(employees.business_id, businessId)))
      .returning();
    if (!updated) {
      throw new Error('Employee not found or not authorized');
    }
    return updated;
  }

  async deleteEmployee(id: number, businessId: number): Promise<void> {
    const result = await db
      .delete(employees)
      .where(and(eq(employees.id, id), eq(employees.business_id, businessId)));
    if (result.rowCount === 0) {
      throw new Error('Employee not found or not authorized');
    }
  }

  // Time Entries
  async getTimeEntries(businessId: number): Promise<TimeEntry[]> {
    return await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.business_id, businessId))
      .orderBy(desc(timeEntries.date));
  }

  async getTimeEntriesByEmployee(employeeId: number, businessId: number): Promise<TimeEntry[]> {
    return await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employee_id, employeeId),
          eq(timeEntries.business_id, businessId)
        )
      )
      .orderBy(desc(timeEntries.date));
  }

  async getTimeEntriesByDateRange(startDate: string, endDate: string, businessId: number): Promise<TimeEntry[]> {
    return await db
      .select()
      .from(timeEntries)
      .where(
        and(
          gte(timeEntries.date, startDate),
          lte(timeEntries.date, endDate),
          eq(timeEntries.business_id, businessId)
        )
      )
      .orderBy(desc(timeEntries.date));
  }

  async createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const [created] = await db.insert(timeEntries).values(timeEntry).returning();
    return created;
  }

  async updateTimeEntry(id: number, timeEntry: Partial<InsertTimeEntry>, businessId: number): Promise<TimeEntry> {
    const [updated] = await db
      .update(timeEntries)
      .set(timeEntry)
      .where(and(
        eq(timeEntries.id, id),
        eq(timeEntries.business_id, businessId)
      ))
      .returning();
    if (!updated) {
      throw new Error('Time entry not found or not authorized');
    }
    return updated;
  }

  async deleteTimeEntry(id: number, businessId: number): Promise<void> {
    const result = await db
      .delete(timeEntries)
      .where(and(
        eq(timeEntries.id, id),
        eq(timeEntries.business_id, businessId)
      ));
    if (result.rowCount === 0) {
      throw new Error('Time entry not found or not authorized');
    }
  }

  // Clients
  async getClients(businessId: number): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.business_id, businessId))
      .orderBy(desc(clients.created_at));
  }

  async getClient(id: number, businessId: number): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.business_id, businessId)));
    return client || undefined;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [created] = await db.insert(clients).values(client).returning();
    return created;
  }

  async updateClient(id: number, client: Partial<InsertClient>, businessId: number): Promise<Client> {
    const [updated] = await db
      .update(clients)
      .set({ ...client, updated_at: new Date() })
      .where(and(eq(clients.id, id), eq(clients.business_id, businessId)))
      .returning();
    if (!updated) {
      throw new Error('Client not found or not authorized');
    }
    return updated;
  }

  async deleteClient(id: number, businessId: number): Promise<void> {
    const result = await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.business_id, businessId)));
    if (result.rowCount === 0) {
      throw new Error('Client not found or not authorized');
    }
  }

  // Quotations
  async getQuotations(businessId: number): Promise<Quotation[]> {
    return await db
      .select()
      .from(quotations)
      .where(eq(quotations.business_id, businessId))
      .orderBy(desc(quotations.created_at));
  }

  async getQuotation(id: number, businessId: number): Promise<Quotation | undefined> {
    const [quotation] = await db
      .select()
      .from(quotations)
      .where(and(
        eq(quotations.id, id),
        eq(quotations.business_id, businessId)
      ));
    return quotation || undefined;
  }

  async getQuotationWithItems(id: number, businessId: number): Promise<(Quotation & { items: QuotationItem[] }) | undefined> {
    const [quotation] = await db
      .select()
      .from(quotations)
      .where(and(
        eq(quotations.id, id),
        eq(quotations.business_id, businessId)
      ));
    if (!quotation) return undefined;

    const items = await this.getQuotationItems(id);
    return { ...quotation, items };
  }

  async createQuotation(quotation: InsertQuotation): Promise<Quotation> {
    const [created] = await db.insert(quotations).values(quotation).returning();
    return created;
  }

  async updateQuotation(id: number, quotation: Partial<InsertQuotation>, businessId: number): Promise<Quotation> {
    const [updated] = await db
      .update(quotations)
      .set({ ...quotation, updated_at: new Date() })
      .where(and(
        eq(quotations.id, id),
        eq(quotations.business_id, businessId)
      ))
      .returning();
    if (!updated) {
      throw new Error('Quotation not found or not authorized');
    }
    return updated;
  }

  async deleteQuotation(id: number, businessId: number): Promise<void> {
    const result = await db
      .delete(quotations)
      .where(and(
        eq(quotations.id, id),
        eq(quotations.business_id, businessId)
      ));
    if (result.rowCount === 0) {
      throw new Error('Quotation not found or not authorized');
    }
  }

  // Quotation Items
  async createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem> {
    const [created] = await db.insert(quotationItems).values(item).returning();
    return created;
  }

  async getQuotationItems(quotationId: number): Promise<QuotationItem[]> {
    return await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, quotationId));
  }

  async getAllQuotationItems(): Promise<QuotationItem[]> {
    return await db.select().from(quotationItems);
  }

  async deleteQuotationItems(quotationId: number): Promise<void> {
    await db.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId));
  }

  // Invoices
  async getInvoices(businessId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.business_id, businessId))
      .orderBy(desc(invoices.created_at));
  }

  async getInvoice(id: number, businessId: number): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(
        eq(invoices.id, id),
        eq(invoices.business_id, businessId)
      ));
    return invoice || undefined;
  }

  async getInvoiceWithItems(id: number, businessId: number): Promise<(Invoice & { items: InvoiceItem[] }) | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(
        eq(invoices.id, id),
        eq(invoices.business_id, businessId)
      ));
    if (!invoice) return undefined;

    const items = await this.getInvoiceItems(id);
    return { ...invoice, items };
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [created] = await db.insert(invoices).values(invoice).returning();
    return created;
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>, businessId: number): Promise<Invoice> {
    const [updated] = await db
      .update(invoices)
      .set({ ...invoice, updated_at: new Date() })
      .where(and(
        eq(invoices.id, id),
        eq(invoices.business_id, businessId)
      ))
      .returning();
    if (!updated) {
      throw new Error('Invoice not found or not authorized');
    }
    return updated;
  }

  async deleteInvoice(id: number, businessId: number): Promise<void> {
    const result = await db
      .delete(invoices)
      .where(and(
        eq(invoices.id, id),
        eq(invoices.business_id, businessId)
      ));
    if (result.rowCount === 0) {
      throw new Error('Invoice not found or not authorized');
    }
  }

  // Invoice Items
  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const [created] = await db.insert(invoiceItems).values(item).returning();
    return created;
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async getAllInvoiceItems(): Promise<InvoiceItem[]> {
    return await db.select().from(invoiceItems);
  }

  async deleteInvoiceItems(invoiceId: number): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  // Payroll
  async getPayrollRecords(businessId: number): Promise<PayrollRecord[]> {
    return await db
      .select()
      .from(payrollRecords)
      .where(eq(payrollRecords.business_id, businessId))
      .orderBy(desc(payrollRecords.pay_period_start));
  }

  async getPayrollRecordsByEmployee(employeeId: number, businessId: number): Promise<PayrollRecord[]> {
    return await db
      .select()
      .from(payrollRecords)
      .where(and(
        eq(payrollRecords.employee_id, employeeId),
        eq(payrollRecords.business_id, businessId)
      ))
      .orderBy(desc(payrollRecords.pay_period_start));
  }

  async getPayrollRecordsByMonth(month: number, year: number, businessId: number): Promise<PayrollRecord[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return await db
      .select()
      .from(payrollRecords)
      .where(
        and(
          gte(payrollRecords.pay_period_start, startDate),
          lte(payrollRecords.pay_period_end, endDate),
          eq(payrollRecords.business_id, businessId)
        )
      )
      .orderBy(desc(payrollRecords.pay_period_start));
  }

  async createPayrollRecord(payroll: InsertPayrollRecord): Promise<PayrollRecord> {
    const [created] = await db.insert(payrollRecords).values(payroll).returning();
    return created;
  }

  async updatePayrollRecord(id: number, payroll: Partial<InsertPayrollRecord>, businessId: number): Promise<PayrollRecord> {
    const [updated] = await db
      .update(payrollRecords)
      .set({ ...payroll, updated_at: new Date() })
      .where(and(
        eq(payrollRecords.id, id),
        eq(payrollRecords.business_id, businessId)
      ))
      .returning();
    if (!updated) {
      throw new Error('Payroll record not found or not authorized');
    }
    return updated;
  }

  async deletePayrollRecord(id: number, businessId: number): Promise<void> {
    const result = await db
      .delete(payrollRecords)
      .where(and(
        eq(payrollRecords.id, id),
        eq(payrollRecords.business_id, businessId)
      ));
    if (result.rowCount === 0) {
      throw new Error('Payroll record not found or not authorized');
    }
  }

  // Email Templates
  async getEmailTemplates(businessId: number): Promise<EmailTemplate[]> {
    return await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.business_id, businessId))
      .orderBy(desc(emailTemplates.created_at));
  }

  async getEmailTemplate(id: number, businessId: number): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.id, id),
        eq(emailTemplates.business_id, businessId)
      ));
    return template || undefined;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [created] = await db.insert(emailTemplates).values(template).returning();
    return created;
  }

  async updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>, businessId: number): Promise<EmailTemplate> {
    const [updated] = await db
      .update(emailTemplates)
      .set({ ...template, updated_at: new Date() })
      .where(and(
        eq(emailTemplates.id, id),
        eq(emailTemplates.business_id, businessId)
      ))
      .returning();
    if (!updated) {
      throw new Error('Email template not found or not authorized');
    }
    return updated;
  }

  async deleteEmailTemplate(id: number, businessId: number): Promise<void> {
    const result = await db
      .delete(emailTemplates)
      .where(and(
        eq(emailTemplates.id, id),
        eq(emailTemplates.business_id, businessId)
      ));
    if (result.rowCount === 0) {
      throw new Error('Email template not found or not authorized');
    }
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    activeProjects: number;
    pendingQuotations: number;
    monthlyRevenue: number;
    teamHours: number;
  }> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    // Get current month's start and end dates
    const monthStart = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
    const monthEnd = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

    // Active projects (unique project names from time entries this month)
    const activeProjectsResult = await db
      .select({ count: sql<number>`count(distinct ${timeEntries.projectName})` })
      .from(timeEntries)
      .where(and(gte(timeEntries.date, monthStart), lte(timeEntries.date, monthEnd)));

    // Pending quotations
    const pendingQuotationsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotations)
      .where(eq(quotations.status, 'pending'));

    // Monthly revenue (paid invoices this month)
    const monthlyRevenueResult = await db
      .select({ total: sql<number>`COALESCE(sum(${invoices.total}), 0)` })
      .from(invoices)
      .where(and(
        eq(invoices.status, 'paid'),
        gte(invoices.paidDate, monthStart),
        lte(invoices.paidDate, monthEnd)
      ));

    // Team hours this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    const teamHoursResult = await db
      .select({ total: sql<number>`COALESCE(sum(${timeEntries.totalHours}), 0)` })
      .from(timeEntries)
      .where(gte(timeEntries.date, weekStartStr));

    return {
      activeProjects: activeProjectsResult[0]?.count || 0,
      pendingQuotations: pendingQuotationsResult[0]?.count || 0,
      monthlyRevenue: monthlyRevenueResult[0]?.total || 0,
      teamHours: teamHoursResult[0]?.total || 0,
    };
  }
}

export const storage = new DatabaseStorage();
