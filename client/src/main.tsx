import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { BusinessProvider } from '@/contexts/BusinessContext';
import App from './App';
import './index.css';

// Create a client
const queryClient = new QueryClient();

// Initialize the application with all necessary providers
const root = createRoot(document.getElementById('root')!);

root.render(
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <BusinessProvider>
        <WebSocketProvider>
          <AnimatePresence mode="wait">
            <App />
          </AnimatePresence>
        </WebSocketProvider>
      </BusinessProvider>
    </QueryClientProvider>
  </HelmetProvider>
);
