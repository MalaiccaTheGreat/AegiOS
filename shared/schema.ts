import { mysqlTable, text, serial, int, decimal, datetime, boolean, date, varchar } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Project status enum

// Project status enum
export const ProjectStatus = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export type ProjectStatusType = typeof ProjectStatus[keyof typeof ProjectStatus];

// Business table
export const businesses = mysqlTable("businesses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  industry: text("industry").notNull(),
  address: text,
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  logo_url: text("logo_url"),
  created_at: datetime('created_at').notNull().default(new Date()),
  updated_at: datetime('updated_at').notNull().default(new Date()),
});

// Services/Inventory table
export const services = mysqlTable("services", {
  id: serial("id").primaryKey(),
  business_id: int("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: text("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text,
  is_active: boolean("is_active").default(true).notNull(),
  created_at: datetime('created_at').notNull().default(new Date()),
  updated_at: datetime('updated_at').notNull().default(new Date()),
});

export const insertServiceSchema = createInsertSchema(services, {
  price: z.string().or(z.number()).transform(val => String(val)),
  is_active: z.boolean().default(true)
}).omit({
  id: true,
  business_id: true,
  created_at: true,
  updated_at: true
});

// Employees table
export const employees = mysqlTable("employees", {
  id: serial("id").primaryKey(),
  business_id: int("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  daily_salary: decimal("daily_salary", { precision: 10, scale: 2 }).notNull(),
  overtime_rate: decimal("overtime_rate", { precision: 10, scale: 2 }).notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: datetime('created_at').notNull().default(new Date()),
  updated_at: datetime('updated_at').notNull().default(new Date()),
});

// Projects table
export const projects = mysqlTable("projects", {
  id: serial("id").primaryKey(),
  business_id: int("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text,
  status: varchar("status", { length: 50 }).$type<ProjectStatusType>().notNull().default('planning'),
  start_date: date("start_date"),
  target_end_date: date("target_end_date"),
  actual_end_date: date("actual_end_date"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  created_at: datetime('created_at').notNull().default(new Date()),
  updated_at: datetime('updated_at').notNull().default(new Date()),
});

// Time entries table
export const timeEntries = mysqlTable("time_entries", {
  id: serial("id").primaryKey(),
  business_id: int("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  project_id: int("project_id").references(() => projects.id, { onDelete: "set null" }),
  employee_id: int("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  date: date("date").notNull(),
  start_time: text("start_time").notNull(),
  end_time: text("end_time").notNull(),
  total_hours: decimal("total_hours", { precision: 4, scale: 2 }).notNull(),
  project_name: text("project_name"),
  notes: text,
  created_at: datetime('created_at').notNull().default(new Date()),
  updated_at: datetime('updated_at').notNull().default(new Date()),
});

// Clients table
export const clients = mysqlTable("clients", {
  id: serial("id").primaryKey(),
  business_id: int("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  address: text,
  created_at: datetime('created_at').notNull().default(new Date()),
  updated_at: datetime('updated_at').notNull().default(new Date()),
});

// Quotations table
export const quotations = mysqlTable("quotations", {
  id: serial("id").primaryKey(),
  business_id: int("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  client_id: int("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  quotation_number: varchar("quotation_number", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, approved, rejected
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax_amount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
  notes: text,
  valid_until: date("valid_until"),
  created_at: datetime('created_at').notNull().default(new Date()),
  updated_at: datetime('updated_at').notNull().default(new Date()),
});

// Quotation items table
export const quotationItems = mysqlTable("quotation_items", {
  id: serial("id").primaryKey(),
  quotation_id: int("quotation_id").references(() => quotations.id).notNull(),
  service_id: int("service_id").references(() => services.id).notNull(),
  quantity: int("quantity").notNull(),
  unit_price: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
});

// Invoices table
export const invoices = mysqlTable("invoices", {
  id: serial("id").primaryKey(),
  business_id: int("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  project_id: int("project_id").references(() => projects.id, { onDelete: "set null" }),
  quotation_id: int("quotation_id").references(() => quotations.id, { onDelete: "set null" }),
  client_id: int("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  invoice_number: varchar("invoice_number", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, paid, overdue
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax_amount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
  due_date: date("due_date"),
  paid_date: date("paid_date"),
  notes: text,
  created_at: datetime('created_at').notNull().default(new Date()),
  updated_at: datetime('updated_at').notNull().default(new Date()),
});

// Invoice items table
export const invoiceItems = mysqlTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoice_id: int("invoice_id").references(() => invoices.id).notNull(),
  service_id: int("service_id").references(() => services.id).notNull(),
  quantity: int("quantity").notNull(),
  unit_price: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
});

// Payroll records table
export const payrollRecords = mysqlTable("payroll_records", {
  id: serial("id").primaryKey(),
  business_id: int("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  employee_id: int("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  month: int("month").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  base_salary: decimal("base_salary", { precision: 10, scale: 2 }).notNull().default(0),
  overtime_hours: decimal("overtime_hours", { precision: 10, scale: 2 }).notNull().default("0"),
  overtime_pay: decimal("overtime_pay", { precision: 10, scale: 2 }).notNull().default("0"),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).notNull().default("0"),
  bonus: decimal("bonus", { precision: 10, scale: 2 }).notNull().default("0"),
  net_pay: decimal("net_pay", { precision: 10, scale: 2 }).notNull(),
  payment_date: date("payment_date").notNull(),
  payment_method: varchar("payment_method", { length: 100 }).notNull(),
  notes: text,
  created_at: datetime('created_at').notNull().default(new Date()),
  updated_at: datetime('updated_at').notNull().default(new Date()),
});

// Email templates table
export const emailTemplates = mysqlTable("email_templates", {
  id: serial("id").primaryKey(),
  business_id: int("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text('body').notNull(),
  type: varchar("type", { length: 50 }).notNull(), // quotation_followup, invoice_reminder, project_update
  created_at: datetime('created_at').notNull().default(new Date()),
  updated_at: datetime('updated_at').notNull().default(new Date()),
});

// Relations
export const employeesRelations = relations(employees, ({ many }) => ({
  timeEntries: many(timeEntries),
  payrollRecords: many(payrollRecords),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  employee: one(employees, {
    fields: [timeEntries.employeeId],
    references: [employees.id],
  }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  quotations: many(quotations),
  invoices: many(invoices),
}));

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  client: one(clients, {
    fields: [quotations.clientId],
    references: [clients.id],
  }),
  items: many(quotationItems),
  invoice: many(invoices),
}));

export const quotationItemsRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationItems.quotationId],
    references: [quotations.id],
  }),
  service: one(services, {
    fields: [quotationItems.serviceId],
    references: [services.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  quotation: one(quotations, {
    fields: [invoices.quotationId],
    references: [quotations.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  service: one(services, {
    fields: [invoiceItems.serviceId],
    references: [services.id],
  }),
}));

// ... (rest of the code remains the same)

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects, {
  status: z.enum([ProjectStatus.PLANNING, ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD, ProjectStatus.COMPLETED, ProjectStatus.CANCELLED])
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
});


export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertQuotationSchema = createInsertSchema(quotations).omit({
  id: true,
  createdAt: true,
});

export const insertQuotationItemSchema = createInsertSchema(quotationItems).omit({
  id: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
});

export const insertPayrollRecordSchema = createInsertSchema(payrollRecords).omit({
  id: true,
  createdAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
});

// Zod Schemas
export const businessSchema = createSelectSchema(businesses);
export const insertBusinessSchema = createInsertSchema(businesses).extend({
  name: z.string().min(1, "Business name is required"),
  industry: z.string().min(1, "Industry is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

// Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;

export type Service = typeof services.$inferSelect;
export type InsertService = Omit<typeof services.$inferInsert, 'id' | 'created_at' | 'updated_at'>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = Omit<typeof employees.$inferInsert, 'id' | 'created_at' | 'updated_at'>;

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = Omit<typeof timeEntries.$inferInsert, 'id' | 'created_at' | 'updated_at'>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = Omit<typeof clients.$inferInsert, 'id' | 'created_at' | 'updated_at'>;

export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = Omit<typeof quotations.$inferInsert, 'id' | 'created_at' | 'updated_at'>;

export type QuotationItem = typeof quotationItems.$inferSelect;
export type InsertQuotationItem = Omit<typeof quotationItems.$inferInsert, 'id'>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = Omit<typeof invoices.$inferInsert, 'id' | 'created_at' | 'updated_at'>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = Omit<typeof invoiceItems.$inferInsert, 'id'>;

export type PayrollRecord = typeof payrollRecords.$inferSelect;
export type InsertPayrollRecord = Omit<typeof payrollRecords.$inferInsert, 'id' | 'created_at' | 'updated_at'>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = Omit<typeof emailTemplates.$inferInsert, 'id' | 'created_at' | 'updated_at'>;
