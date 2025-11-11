# Business Management System

## Overview

This is a full-stack business management application built with React, Express.js, and PostgreSQL. The system provides comprehensive tools for managing business operations including inventory, employees, time tracking, quotations, invoices, payroll, and email communications.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM
- **API**: RESTful API design with JSON responses
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: Hot module replacement via Vite middleware

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL adapter
- **Database Provider**: Neon serverless PostgreSQL
- **Schema**: Type-safe database schema with Zod validation
- **Migrations**: Drizzle Kit for database migrations

## Key Components

### Database Schema
The system includes the following main entities:
- **Services**: Business services/inventory with pricing and categories
- **Employees**: Staff management with roles and salary information
- **Time Entries**: Time tracking for employees with project associations
- **Clients**: Customer information and contact details
- **Quotations**: Price quotes with line items and approval workflow
- **Invoices**: Billing documents with payment tracking
- **Payroll Records**: Employee compensation calculations
- **Email Templates**: Reusable email templates for communications

### Frontend Pages
- **Dashboard**: Overview with metrics and quick actions
- **Inventory**: Service and product management
- **Employees**: Staff management and profiles
- **Time Tracking**: Employee time entry and reporting
- **Quotations**: Quote creation and management
- **Invoices**: Invoice generation and tracking
- **Payroll**: Compensation management and calculations
- **Reports**: Business analytics and reporting
- **Email**: Template management and communication tools

### API Routes
The backend provides RESTful endpoints for:
- CRUD operations for all entities
- Dashboard metrics and analytics
- File uploads and document generation
- Email sending capabilities
- Payroll calculations

## Data Flow

### Client-Server Communication
1. Frontend makes HTTP requests using TanStack Query
2. Express server handles routing and business logic
3. Drizzle ORM manages database interactions
4. Response data is cached and managed by React Query
5. UI components reactively update based on data changes

### State Management
- Server state is managed by TanStack Query with automatic caching
- Local component state uses React hooks
- Form state is managed with controlled components
- Toast notifications provide user feedback

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe ORM with PostgreSQL support
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React router

### UI Libraries
- **@radix-ui**: Low-level UI primitives for accessibility
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Utility for component variants

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Type safety
- **drizzle-kit**: Database migration tool
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

## Deployment Strategy

### Development Environment
- Local development server runs on port 5000
- Vite handles hot module replacement
- PostgreSQL database connection via environment variables
- Real-time error overlay for debugging

### Production Build
- Frontend builds to static files in `dist/public`
- Backend compiles to ES modules in `dist`
- Single server serves both API and static files
- Environment-based configuration

### Replit Integration
- Configured for Replit's autoscale deployment
- Database provisioning through Replit's PostgreSQL service
- Automatic builds and deployments
- Port configuration for external access

## Recent Changes

### June 18, 2025 - BLACKMOUNTAIN ENTERPRISE Integration
- Updated system branding to match BLACKMOUNTAIN ENTERPRISE format from user's PDF samples
- Created professional quotation and invoice templates with exact company formatting
- Added quotation and invoice preview/print functionality with proper BLACKMOUNTAIN headers
- Integrated company details: P.O BOX 22070 Kitwe, TPIN: 1000268843, contact information
- Added signature sections for "Prepared By: NJEKWA AONGOLA" and "Received By" fields
- Implemented quick action buttons for adding employees and services directly from dashboard
- Employee creation modal includes role, daily salary, and overtime rate fields
- Service creation modal supports construction-focused categories and pricing

### System Architecture Updates
- Enhanced dashboard with employee and service creation capabilities
- Professional document templates matching exact PDF format requirements
- Streamlined workflow for construction business operations

## User Preferences

```
Preferred communication style: Simple, everyday language.
```