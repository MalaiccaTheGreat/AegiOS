// Server configuration
export const PORT = process.env.PORT || 3001;
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export const NODE_ENV = process.env.NODE_ENV || 'development';

// Database configuration
export const DB_HOST = process.env.DB_HOST || 'localhost';
export const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
export const DB_NAME = process.env.DB_NAME || 'aegios';
export const DB_USER = process.env.DB_USER || 'postgres';
export const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';

// WebSocket configuration
export const WS_PATH = process.env.WS_PATH || '/ws';

// CORS configuration
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Rate limiting
const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ? 
  parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) : 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX ? 
  parseInt(process.env.RATE_LIMIT_MAX, 10) : 100; // 100 requests per window

export { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX };

// Session configuration
export const SESSION_SECRET = process.env.SESSION_SECRET || 'your-session-secret';
export const SESSION_COOKIE_MAX_AGE = process.env.SESSION_COOKIE_MAX_AGE ? 
  parseInt(process.env.SESSION_COOKIE_MAX_AGE, 10) : 24 * 60 * 60 * 1000; // 24 hours

// File upload configuration
export const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE ? 
  parseInt(process.env.MAX_FILE_SIZE, 10) : 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf')
  .split(',')
  .map(type => type.trim());

// Email configuration
export const SMTP_HOST = process.env.SMTP_HOST || 'smtp.example.com';
export const SMTP_PORT = process.env.SMTP_PORT ? 
  parseInt(process.env.SMTP_PORT, 10) : 587;
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
export const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@aegios.com';
