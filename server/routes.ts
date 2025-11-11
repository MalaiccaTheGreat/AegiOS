import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertServiceSchema,
  insertEmployeeSchema,
  insertTimeEntrySchema,
  insertClientSchema,
  insertQuotationSchema,
  insertQuotationItemSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertPayrollRecordSchema,
  insertEmailTemplateSchema,
  insertProjectSchema,
  ProjectStatus,
} from "@shared/schema";
import { z } from "zod";
import { AuthService } from "./src/services/core/authService";
import { logger } from "./src/utils/logger";

// Schema for registration request
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validate request body
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.error.errors,
        });
      }

      const { email, password, firstName, lastName } = validation.data;

      try {
        const result = await AuthService.register(email, password, firstName, lastName);
        
        res.status(201).json({
          success: true,
          message: "User registered successfully",
          data: {
            user: {
              id: result.user.id,
              email: result.user.email,
              firstName: result.user.firstName,
              lastName: result.user.lastName,
              role: result.user.role,
            },
            token: result.tokens.accessToken,
          },
        });
      } catch (error: any) {
        logger.error("Registration error:", error);
        if (error.message === "User with this email already exists") {
          return res.status(409).json({
            success: false,
            message: "A user with this email already exists",
          });
        }
        throw error;
      }
    } catch (error) {
      logger.error("Registration failed:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred during registration",
      });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      try {
        const result = await AuthService.login(email, password);
        
        res.json({
          success: true,
          message: "Login successful",
          data: {
            user: {
              id: result.user.id,
              email: result.user.email,
              firstName: result.user.firstName,
              lastName: result.user.lastName,
              role: result.user.role,
            },
            token: result.tokens.accessToken,
          },
        });
      } catch (error: any) {
        if (error.message === "Invalid credentials") {
          return res.status(401).json({
            success: false,
            message: "Invalid email or password",
          });
        }
        throw error;
      }
    } catch (error) {
      logger.error("Login failed:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred during login",
      });
    }
  });
  // Business routes
  app.get("/api/businesses", async (req, res) => {
    try {
      const businesses = await storage.getBusinesses();
      res.json(businesses);
    } catch (error) {
      console.error("Failed to fetch businesses:", error);
      res.status(500).json({ message: "Failed to fetch businesses" });
    }
  });

  app.get("/api/businesses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid business ID" });
      }
      
      const business = await storage.getBusiness(id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      console.error("Failed to fetch business:", error);
      res.status(500).json({ message: "Failed to fetch business" });
    }
  });

  app.post("/api/businesses", async (req, res) => {
    try {
      const businessData = req.body;
      const business = await storage.createBusiness(businessData);
      res.status(201).json(business);
    } catch (error) {
      console.error("Failed to create business:", error);
      res.status(500).json({ message: "Failed to create business" });
    }
  });

  app.put("/api/businesses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid business ID" });
      }
      
      const businessData = req.body;
      const business = await storage.updateBusiness(id, businessData);
      res.json(business);
    } catch (error) {
      console.error("Failed to update business:", error);
      res.status(500).json({ message: "Failed to update business" });
    }
  });

  app.delete("/api/businesses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid business ID" });
      }
      
      await storage.deleteBusiness(id);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete business:", error);
      res.status(500).json({ message: "Failed to delete business" });
    }
  });

  // Services routes with business filtering
  app.get("/api/services", async (req, res) => {
    try {
      const businessId = parseInt(req.query.businessId as string);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const services = await storage.getServices(businessId);
      res.json(services);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessId = parseInt(req.query.businessId as string);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const service = await storage.getService(id, businessId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Failed to fetch service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const businessId = parseInt(req.body.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const service = insertServiceSchema.parse(req.body);
      const created = await storage.createService(service);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.put("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = insertServiceSchema.partial().parse(req.body);
      const updated = await storage.updateService(id, service);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteService(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Employees routes with business filtering
  app.get("/api/employees", async (req, res) => {
    try {
      const businessId = parseInt(req.query.businessId as string);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      const employees = await storage.getEmployees(businessId);
      res.json(employees);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessId = parseInt(req.query.businessId as string);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const employee = await storage.getEmployee(id, businessId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Failed to fetch employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const businessId = parseInt(req.body.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const employeeData = { ...req.body, business_id: businessId };
      const employee = insertEmployeeSchema.parse(employeeData);
      const created = await storage.createEmployee(employee);
      res.status(201).json(created);
    } catch (error) {
      console.error("Failed to create employee:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessId = parseInt(req.body.businessId);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const employee = insertEmployeeSchema.partial().parse(req.body);
      const updated = await storage.updateEmployee(id, employee, businessId);
      
      if (!updated) {
        return res.status(404).json({ message: "Employee not found or not authorized" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update employee:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessId = parseInt(req.query.businessId as string);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      await storage.deleteEmployee(id, businessId);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete employee:", error);
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Time entries routes with business filtering
  app.get("/api/time-entries", async (req, res) => {
    try {
      const { employeeId, startDate, endDate, businessId: businessIdStr } = req.query;
      const businessId = parseInt(businessIdStr as string);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      let timeEntries;
      if (employeeId) {
        timeEntries = await storage.getTimeEntriesByEmployee(
          parseInt(employeeId as string),
          businessId
        );
      } else if (startDate && endDate) {
        timeEntries = await storage.getTimeEntriesByDateRange(
          startDate as string, 
          endDate as string,
          businessId
        );
      } else {
        timeEntries = await storage.getTimeEntries(businessId);
      }
      
      res.json(timeEntries);
    } catch (error) {
      console.error("Failed to fetch time entries:", error);
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  app.post("/api/time-entries", async (req, res) => {
    try {
      const businessId = parseInt(req.body.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const timeEntryData = { ...req.body, business_id: businessId };
      const timeEntry = insertTimeEntrySchema.parse(timeEntryData);
      const created = await storage.createTimeEntry(timeEntry);
      res.status(201).json(created);
    } catch (error) {
      console.error("Failed to create time entry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid time entry data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create time entry" });
    }
  });

  app.put("/api/time-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessId = parseInt(req.body.businessId);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const timeEntryData = { ...req.body, updated_at: new Date() };
      const timeEntry = insertTimeEntrySchema.partial().parse(timeEntryData);
      const updated = await storage.updateTimeEntry(id, timeEntry, businessId);
      
      if (!updated) {
        return res.status(404).json({ message: "Time entry not found or not authorized" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update time entry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid time entry data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update time entry" });
    }
  });

  app.delete("/api/time-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessId = parseInt(req.query.businessId as string);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      await storage.deleteTimeEntry(id, businessId);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete time entry:", error);
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete time entry" });
    }
  });

  // Clients routes with business filtering
  app.get("/api/clients", async (req, res) => {
    try {
      const businessId = parseInt(req.query.businessId as string);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      const clients = await storage.getClients(businessId);
      res.json(clients);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessId = parseInt(req.query.businessId as string);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const client = await storage.getClient(id, businessId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Failed to fetch client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const businessId = parseInt(req.body.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const clientData = { ...req.body, business_id: businessId };
      const client = insertClientSchema.parse(clientData);
      const created = await storage.createClient(client);
      res.status(201).json(created);
    } catch (error) {
      console.error("Failed to create client:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid client data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessId = parseInt(req.body.businessId);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const client = insertClientSchema.partial().parse(req.body);
      const updated = await storage.updateClient(id, client, businessId);
      
      if (!updated) {
        return res.status(404).json({ message: "Client not found or not authorized" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update client:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid client data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessId = parseInt(req.query.businessId as string);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      await storage.deleteClient(id, businessId);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete client:", error);
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Quotations routes with business filtering
  app.get("/api/quotations", async (req, res) => {
    try {
      const businessId = parseInt(req.query.businessId as string);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      const quotations = await storage.getQuotations(businessId);
      res.json(quotations);
    } catch (error) {
      console.error("Failed to fetch quotations:", error);
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  app.get("/api/quotations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessId = parseInt(req.query.businessId as string);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const quotation = await storage.getQuotation(id, businessId);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      res.json(quotation);
    } catch (error) {
      console.error("Failed to fetch quotation:", error);
      res.status(500).json({ message: "Failed to fetch quotation" });
    }
  });

  app.post("/api/quotations", async (req, res) => {
    try {
      const businessId = parseInt(req.body.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const quotationData = { ...req.body, business_id: businessId };
      const quotation = insertQuotationSchema.parse(quotationData);
      const created = await storage.createQuotation(quotation);
      res.status(201).json(created);
    } catch (error) {
      console.error("Failed to create quotation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid quotation data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create quotation" });
    }
  });

  app.put("/api/quotations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessId = parseInt(req.body.businessId);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const quotation = insertQuotationSchema.partial().parse(req.body);
      const updated = await storage.updateQuotation(id, quotation, businessId);
      
      if (!updated) {
        return res.status(404).json({ message: "Quotation not found or not authorized" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update quotation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid quotation data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update quotation" });
    }
  });

  app.delete("/api/quotations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessId = parseInt(req.query.businessId as string);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      await storage.deleteQuotation(id, businessId);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete quotation:", error);
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete quotation" });
    }
  });

  // Invoices routes with business filtering
  app.get("/api/invoices", async (req, res) => {
    try {
      const businessId = parseInt(req.query.businessId as string);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      const invoices = await storage.getInvoices(businessId);
      res.json(invoices);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessId = parseInt(req.query.businessId as string);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const invoice = await storage.getInvoice(id, businessId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Failed to fetch invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const businessId = parseInt(req.body.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const invoiceData = { ...req.body, business_id: businessId };
      const invoice = insertInvoiceSchema.parse(invoiceData);
      const created = await storage.createInvoice(invoice);
      res.status(201).json(created);
    } catch (error) {
      console.error("Failed to create invoice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid invoice data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessId = parseInt(req.body.businessId);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const invoice = insertInvoiceSchema.partial().parse(req.body);
      const updated = await storage.updateInvoice(id, invoice, businessId);
      
      if (!updated) {
        return res.status(404).json({ message: "Invoice not found or not authorized" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update invoice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid invoice data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Payroll routes with business filtering
  app.get("/api/payroll", async (req, res) => {
    try {
      const { employeeId, month, year, businessId: businessIdStr } = req.query;
      const businessId = parseInt(businessIdStr as string);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      let records;
      if (employeeId) {
        records = await storage.getPayrollRecordsByEmployee(
          parseInt(employeeId as string),
          businessId
        );
      } else if (month && year) {
        records = await storage.getPayrollRecordsByMonth(
          parseInt(month as string), 
          parseInt(year as string),
          businessId
        );
      } else {
        records = await storage.getPayrollRecords(businessId);
      }
      
      res.json(records);
    } catch (error) {
      console.error("Failed to fetch payroll records:", error);
      res.status(500).json({ message: "Failed to fetch payroll records" });
    }
  });

  app.post("/api/payroll", async (req, res) => {
    try {
      const businessId = parseInt(req.body.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const payrollData = { ...req.body, business_id: businessId };
      const payroll = insertPayrollRecordSchema.parse(payrollData);
      const created = await storage.createPayrollRecord(payroll);
      res.status(201).json(created);
    } catch (error) {
      console.error("Failed to create payroll record:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid payroll data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create payroll record" });
    }
  });

  app.put("/api/payroll/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessId = parseInt(req.body.businessId);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const payrollData = { ...req.body, updated_at: new Date() };
      const payroll = insertPayrollRecordSchema.partial().parse(payrollData);
      const updated = await storage.updatePayrollRecord(id, payroll, businessId);
      
      if (!updated) {
        return res.status(404).json({ message: "Payroll record not found or not authorized" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update payroll record:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid payroll data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update payroll record" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse({
        ...req.body,
        business_id: req.body.business_id,
      });
      
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      console.error("Failed to create project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessId = parseInt(req.body.businessId as string);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }

      const updateData = insertProjectSchema.partial().parse(req.body);
      
      const project = await storage.updateProject(id, updateData, businessId);
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      } else if (error instanceof Error && error.message === 'Project not found or you do not have permission to update it') {
        return res.status(404).json({ message: error.message });
      }
      console.error("Failed to update project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessId = parseInt(req.query.businessId as string);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      await storage.deleteProject(id, businessId);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  app.get("/api/projects/:id/time-entries", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const businessId = parseInt(req.query.businessId as string);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const timeEntries = await storage.getProjectTimeEntries(projectId, businessId);
      res.json(timeEntries);
    } catch (error) {
      console.error("Failed to fetch project time entries:", error);
      res.status(500).json({ message: "Failed to fetch project time entries" });
    }
  });

  app.get("/api/projects/:id/invoices", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const businessId = parseInt(req.query.businessId as string);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const invoices = await storage.getProjectInvoices(projectId, businessId);
      res.json(invoices);
    } catch (error) {
      console.error("Failed to fetch project invoices:", error);
      res.status(500).json({ message: "Failed to fetch project invoices" });
    }
  });

  app.get("/api/projects/:id/metrics", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const businessId = parseInt(req.query.businessId as string);
      
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const metrics = await storage.getProjectMetrics(projectId, businessId);
      res.json(metrics);
    } catch (error) {
      if (error instanceof Error && error.message === 'Project not found') {
        return res.status(404).json({ message: error.message });
      }
      console.error("Failed to fetch project metrics:", error);
      res.status(500).json({ message: "Failed to fetch project metrics" });
    }
  });

  // Email templates routes with business filtering
  app.get("/api/email-templates", async (req, res) => {
    try {
      const businessId = parseInt(req.query.businessId as string);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      const templates = await storage.getEmailTemplates(businessId);
      res.json(templates);
    } catch (error) {
      console.error("Failed to fetch email templates:", error);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  app.post("/api/email-templates", async (req, res) => {
    try {
      const businessId = parseInt(req.body.businessId);
      if (isNaN(businessId)) {
        return res.status(400).json({ message: "Business ID is required" });
      }
      
      const templateData = { ...req.body, business_id: businessId };
      const template = insertEmailTemplateSchema.parse(templateData);
      const created = await storage.createEmailTemplate(template);
      res.status(201).json(created);
    } catch (error) {
      console.error("Failed to create email template:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid template data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create email template" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Calculate payroll for current month
  app.post("/api/payroll/calculate", async (req, res) => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      // Get current month's start and end dates
      const monthStart = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
      const monthEnd = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
      
      const employees = await storage.getEmployees();
      const payrollResults = [];
      
      for (const employee of employees) {
        if (!employee.isActive) continue;
        
        const timeEntries = await storage.getTimeEntriesByDateRange(monthStart, monthEnd);
        const employeeTimeEntries = timeEntries.filter(entry => entry.employeeId === employee.id);
        
        const totalHours = employeeTimeEntries.reduce((sum, entry) => sum + parseFloat(entry.totalHours), 0);
        const regularHours = Math.min(totalHours, 160); // Assuming 160 regular hours per month
        const overtimeHours = Math.max(totalHours - 160, 0);
        
        const regularPay = regularHours * parseFloat(employee.dailySalary);
        const overtimePay = overtimeHours * parseFloat(employee.overtimeRate) * 1.5;
        const totalPay = regularPay + overtimePay;
        
        const payrollRecord = await storage.createPayrollRecord({
          employeeId: employee.id,
          month: currentMonth,
          year: currentYear,
          regularHours: regularHours.toString(),
          overtimeHours: overtimeHours.toString(),
          regularPay: regularPay.toString(),
          overtimePay: overtimePay.toString(),
          totalPay: totalPay.toString(),
        });
        
        payrollResults.push(payrollRecord);
      }
      
      res.json(payrollResults);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate payroll" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
