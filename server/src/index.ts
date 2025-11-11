import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createConnection } from 'mysql2/promise';
import { db } from './db';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { setupRoutes } from './routes';
import { setupWebSocket } from './websocket';

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup WebSocket
const io = new SocketIOServer(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/ws',
  serveClient: false
});

// Setup WebSocket connection manager
setupWebSocket(io);

// Setup API routes
setupRoutes(app);

// Error handling middleware (must be last)
app.use(errorHandler);

// Test database connection and start server
async function startServer() {
  try {
    // Test database connection
    const connection = await createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME
    });
    
    await connection.ping();
    await connection.end();
    
    console.log('✅ Database connection successful');
    
    // Start server
    server.listen(env.PORT, env.HOST, () => {
      console.log(`🚀 Server running on http://${env.HOST}:${env.PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
const gracefulShutdown = () => {
  console.log('🛑 Received shutdown signal, closing server...');
  
  server.close(async () => {
    console.log('✅ HTTP server closed');
    
    // Close database connections
    await db.end();
    console.log('✅ Database connections closed');
    
    process.exit(0);
  });

  // Force close server after 10 seconds
  setTimeout(() => {
    console.error('❌ Force closing server');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
startServer();
