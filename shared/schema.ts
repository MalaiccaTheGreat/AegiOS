import { pgTable, text, serial, integer, decimal, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

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
export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  industry: text("industry").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  logo_url: text("logo_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Services/Inventory table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  business_id: integer("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
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
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  business_id: integer("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  daily_salary: decimal("daily_salary", { precision: 10, scale: 2 }).notNull(),
  overtime_rate: decimal("overtime_rate", { precision: 10, scale: 2 }).notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  business_id: integer("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").$type<ProjectStatusType>().notNull().default('planning'),
  start_date: date("start_date"),
  target_end_date: date("target_end_date"),
  actual_end_date: date("actual_end_date"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Time entries table
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  business_id: integer("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  project_id: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  employee_id: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  date: date("date").notNull(),
  start_time: text("start_time").notNull(),
  end_time: text("end_time").notNull(),
  total_hours: decimal("total_hours", { precision: 4, scale: 2 }).notNull(),
  project_name: text("project_name"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  business_id: integer("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Quotations table
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  business_id: integer("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  client_id: integer("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  quotation_number: text("quotation_number").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax_amount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  valid_until: date("valid_until"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Quotation items table
export const quotationItems = pgTable("quotation_items", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").references(() => quotations.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  business_id: integer("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  project_id: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  quotation_id: integer("quotation_id").references(() => quotations.id, { onDelete: "set null" }),
  client_id: integer("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  invoice_number: text("invoice_number").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, overdue
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax_amount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  due_date: date("due_date"),
  paid_date: date("paid_date"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Invoice items table
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

// Payroll records table
export const payrollRecords = pgTable("payroll_records", {
  id: serial("id").primaryKey(),
  business_id: integer("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  employee_id: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  base_salary: decimal("base_salary", { precision: 10, scale: 2 }).notNull(),
  overtime_hours: decimal("overtime_hours", { precision: 10, scale: 2 }).default("0").notNull(),
  overtime_pay: decimal("overtime_pay", { precision: 10, scale: 2 }).default("0").notNull(),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).default("0").notNull(),
  bonus: decimal("bonus", { precision: 10, scale: 2 }).default("0").notNull(),
  net_pay: decimal("net_pay", { precision: 10, scale: 2 }).notNull(),
  payment_date: date("payment_date").notNull(),
  payment_method: text("payment_method").notNull(),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Email templates table
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  business_id: integer("business_id").references(() => businesses.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull(), // quotation_followup, invoice_reminder, project_update
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
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
