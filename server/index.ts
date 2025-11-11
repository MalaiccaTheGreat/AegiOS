import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { PORT } from './config.js';

const app = express();
const server = http.createServer(app);

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
  
// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({ 
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start the server
(async () => {
  try {
    // In development, set up Vite
    if (process.env.NODE_ENV === 'development') {
      await setupVite(app, server);
    } 
    // In production, serve static files
    else {
      // This will set up static file serving and SPA fallback
      serveStatic(app);
    }
    
    // Register API routes after static files but before the SPA fallback
    app.use("/api/ai", aiRoutes);
    app.use("/api/time-entries", timeEntriesRoutes);
    
    // Register all routes
    await registerRoutes(app);
    
    server.listen(PORT, () => {
      log(`Server started on port ${PORT}`);
      log(`WebSocket server running on ws://localhost:${PORT}`);
      log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      log(`CORS allowed origin: ${CORS_ORIGIN}`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Consider whether to terminate the process in production
    // process.exit(1);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Consider whether to terminate the process in production
    // process.exit(1);
  });

  // Handle process termination
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  });
})();
