import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

type EnvVars = {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  HOST: string;
  CORS_ORIGIN: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  ADMIN_JWT_SECRET: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  ADMIN_FIRST_NAME: string;
  ADMIN_LAST_NAME: string;
  API_PREFIX: string;
  API_VERSION: string;
  LOG_LEVEL: string;
  LOG_TO_FILE: boolean;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
  SESSION_SECRET: string;
  SESSION_COOKIE_MAX_AGE: number;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
};

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1d'),
  
  // Admin
  ADMIN_JWT_SECRET: z.string().min(32),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  ADMIN_FIRST_NAME: z.string().default('Admin'),
  ADMIN_LAST_NAME: z.string().default('User'),
  
  // API
  API_PREFIX: z.string().default('/api'),
  API_VERSION: z.string().default('v1'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  LOG_TO_FILE: z.coerce.boolean().default(false),
  
  // Security
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  SESSION_SECRET: z.string().min(32),
  SESSION_COOKIE_MAX_AGE: z.coerce.number().default(7 * 24 * 60 * 60 * 1000), // 7 days
  
  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
});

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

// Validate environment variables
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

// Export validated environment variables
export const env = _env.data as EnvVars;

// Log environment mode
if (env.NODE_ENV === 'development') {
  console.log('🚀 Running in development mode');
} else if (env.NODE_ENV === 'production') {
  console.log('🚀 Running in production mode');
  
  // Security checks for production
  if (env.ADMIN_PASSWORD === 'change_me_123') {
    console.error('❌ ERROR: Change the default admin password in production!');
    process.exit(1);
  }
  
  if (env.JWT_SECRET === 'your_jwt_secret_key_here' || 
      env.ADMIN_JWT_SECRET === 'your_admin_jwt_secret_here') {
    console.error('❌ ERROR: Change the JWT secrets in production!');
    process.exit(1);
  }
}

// Export type for TypeScript
export type Env = typeof env;
