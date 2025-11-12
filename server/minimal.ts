import express, { Request, Response } from 'express';
import http from 'http';
import { createPool } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import type { MySql2Database } from 'drizzle-orm/mysql2';

interface DatabaseSchema {
  // Define your schema types here
  // Example: users: typeof users;
}

let db: MySql2Database<DatabaseSchema>;

async function initializeApp() {
  // Load schema dynamically
  let schema: any;
  try {
    try {
      // Try with .js extension first (for built files)
      const schemaModule = await import('./shared/schema.js');
      schema = schemaModule.default || schemaModule;
    } catch (e) {
      // Try without extension (for TypeScript source)
      const schemaModule = await import('./shared/schema');
      schema = schemaModule.default || schemaModule;
    }

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

      // Setup middleware
      app.use(express.json());
      app.use(express.urlencoded({ extended: false }));

      // Routes
      app.get('/health', (req: Request, res: Response) => {
        res.status(200).json({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        });
      });

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
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Database test error:', errorMessage);
          res.status(500).json({
            success: false,
            message: 'Database test failed',
            error: errorMessage
          });
        }
      });

      // Start the server after database is connected
      const port = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT || 3001;
      server.listen(port, '0.0.0.0', () => {
        console.log(`Server is running on http://localhost:${port}`);
      });
    } catch (error: unknown) {
      console.error('Failed to initialize application:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  } catch (error: unknown) {
    console.error('Failed to load schema:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Initialize the application
initializeApp().catch((error) => {
  console.error('Fatal error during initialization:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: unknown) => {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error('Unhandled Rejection:', error.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
