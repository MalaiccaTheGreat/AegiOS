import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useResponsive } from '@/contexts/BusinessContext';
import { cn } from '@/lib/utils';

interface Metric {
  id: string;
  label: string;
  value: number | string;
  change?: number; // percentage change
  format?: 'currency' | 'number' | 'percent';
  icon?: React.ReactNode;
}

export function LiveMetrics() {
  const [metrics, setMetrics] = useState<Record<string, Metric>>({});
  const { subscribe, isConnected } = useWebSocket();
  const { isMobile, responsive } = useResponsive();

  // Subscribe to metrics updates
  useEffect(() => {
    const unsubscribe = subscribe('metrics:update', (data: Record<string, any>) => {
      setMetrics(prev => ({
        ...prev,
        [data.id]: {
          ...prev[data.id],
          ...data,
          // Add animation state
          _updatedAt: Date.now(),
        },
      }));
    });

    // Initial metrics load
    // In a real app, you would fetch initial metrics via an API
    setMetrics({
      revenue: {
        id: 'revenue',
        label: 'Total Revenue',
        value: 0,
        change: 0,
        format: 'currency',
      },
      customers: {
        id: 'customers',
        label: 'Active Customers',
        value: 0,
        change: 0,
        format: 'number',
      },
      conversion: {
        id: 'conversion',
        label: 'Conversion Rate',
        value: 0,
        change: 0,
        format: 'percent',
      },
      orders: {
        id: 'orders',
        label: 'New Orders',
        value: 0,
        change: 0,
        format: 'number',
      },
    });

    return () => unsubscribe();
  }, [subscribe]);

  const formatValue = (metric: Metric) => {
    const numValue = typeof metric.value === 'string' ? parseFloat(metric.value) : metric.value;
    
    switch (metric.format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(numValue);
      case 'percent':
        return new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(numValue / 100);
      default:
        return new Intl.NumberFormat().format(numValue);
    }
  };

  return (
    <div className={cn(
      'grid gap-4',
      responsive.grid,
      isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'
    )}>
      {Object.values(metrics).map((metric) => (
        <MetricCard 
          key={metric.id} 
          metric={metric} 
          formattedValue={formatValue(metric)}
        />
      ))}
      
      {!isConnected && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg shadow-lg">
          Reconnecting to live data...
        </div>
      )}
    </div>
  );
}

function MetricCard({ 
  metric, 
  formattedValue 
}: { 
  metric: Metric & { _updatedAt?: number };
  formattedValue: string;
}) {
  const [displayValue, setDisplayValue] = useState(formattedValue);
  const prevValue = usePrevious(metric.value);
  const change = metric.change || 0;
  
  // Handle value changes with animation
  useEffect(() => {
    if (prevValue !== undefined && prevValue !== metric.value) {
      // Trigger animation by updating the display value after a delay
      const timer = setTimeout(() => {
        setDisplayValue(formattedValue);
      }, 150);
      
      return () => clearTimeout(timer);
    }
    return undefined; // Explicitly return undefined when no cleanup is needed
  }, [metric.value, formattedValue, prevValue]);

  return (
    <motion.div 
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700',
        'transition-all duration-300 hover:shadow-md hover:border-opacity-50',
        'flex flex-col h-full'
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {metric.label}
        </h3>
        {metric.icon && (
          <div className="p-1.5 rounded-lg bg-opacity-10 bg-current">
            {metric.icon}
          </div>
        )}
      </div>
      
      <div className="mt-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={metric._updatedAt || 'initial'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-2xl font-semibold text-gray-900 dark:text-white"
          >
            {displayValue}
          </motion.div>
        </AnimatePresence>
        
        {metric.change !== undefined && (
          <div className={cn(
            'mt-2 text-sm flex items-center',
            change > 0 ? 'text-green-600 dark:text-green-400' : 
            change < 0 ? 'text-red-600 dark:text-red-400' : 
            'text-gray-500'
          )}>
            {change > 0 ? '↑' : change < 0 ? '↓' : '→'}
            <span className="ml-1">
              {Math.abs(change)}% {change !== 0 && (change > 0 ? 'increase' : 'decrease')}
            </span>
            <span className="ml-1 text-xs text-gray-400">vs last period</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Helper hook to get previous value
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// Add this to your global CSS for smooth number transitions
const globalStyles = `
  .smooth-number {
    transition: color 0.3s ease-in-out;
  }
  .smooth-number.increase {
    color: #10B981; /* green-500 */
  }
  .smooth-number.decrease {
    color: #EF4444; /* red-500 */
  }
`;

// Add to your global styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = globalStyles;
  document.head.appendChild(style);
}
