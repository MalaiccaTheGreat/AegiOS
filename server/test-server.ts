import express, { Request, Response } from 'express';

const app = express();
const PORT = 3001;

// Basic health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Test server is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Test server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
