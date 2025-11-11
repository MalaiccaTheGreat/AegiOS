import express, { Request, Response } from 'express';
import http from 'http';
import { createPool } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './shared/schema.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Database configuration
const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'aegios'
} = process.env;

// Create database connection
let db;
try {
  const connection = createPool({
    host: DB_HOST,
    port: parseInt(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined
  });

  db = drizzle(connection, { schema, mode: 'default' });
  console.log('Database connection established');
} catch (error) {
  console.error('Failed to connect to the database:', error);
  process.exit(1);
}

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('AegiOS API is running');
});

// Test database connection
app.get('/test-db', async (req: Request, res: Response) => {
  try {
    // Try to get the current time from the database
    const [result] = await db.select().from(schema.timeEntries).limit(1);
    res.json({
      success: true,
      message: 'Database connection successful',
      testData: result || 'No data found, but connection is working'
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: error.message
    });
  }
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
