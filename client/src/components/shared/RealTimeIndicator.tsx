import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface RealTimeIndicatorProps {
  lastUpdated?: Date;
  className?: string;
  showIcon?: boolean;
}

const RealTimeIndicator = ({
  lastUpdated,
  className,
  showIcon = true,
}: RealTimeIndicatorProps) => {
  const [timeAgo, setTimeAgo] = useState<string>('Just now');

  useEffect(() => {
    if (!lastUpdated) return;

    const updateTimeAgo = () => {
      const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
      
      if (seconds < 10) {
        setTimeAgo('Just now');
      } else if (seconds < 60) {
        setTimeAgo(`${seconds} seconds ago`);
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`${minutes} minute${minutes === 1 ? '' : 's'} ago`);
      } else {
        const hours = Math.floor(seconds / 3600);
        setTimeAgo(`${hours} hour${hours === 1 ? '' : 's'} ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastUpdated]);

  if (!lastUpdated) return null;

  return (
    <div className={cn('flex items-center text-xs text-muted-foreground', className)}>
      {showIcon && <Clock className="mr-1 h-3 w-3" />}
      <span>Updated {timeAgo}</span>
      <span 
        className="ml-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"
        aria-label="Live data"
      />
    </div>
  );
};

export default RealTimeIndicator;
