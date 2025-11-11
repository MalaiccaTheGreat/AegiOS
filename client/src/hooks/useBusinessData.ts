import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useBusiness } from '@/contexts/BusinessContext';

interface BusinessMetrics {
  revenue: number;
  revenueChange: number;
  activeUsers: number;
  userGrowth: number;
  conversionRate: number;
  conversionChange: number;
  avgResponseTime: number;
  responseTimeChange: number;
  revenueData: Array<{
    month: string;
    revenue: number;
  }>;
  userActivityData: Array<{
    date: string;
    activeUsers: number;
    newUsers: number;
  }>;
  recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
  }>;
  aiInsights: Array<{
    id: string;
    title: string;
    description: string;
    suggestion?: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export const useBusinessData = (businessId?: string) => {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const queryClient = useQueryClient();
  const { socket } = useWebSocket();
  const { currentBusiness } = useBusiness();

  const fetchBusinessData = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/businesses/${id}/metrics`);
      if (!response.ok) {
        throw new Error('Failed to fetch business metrics');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching business data:', error);
      throw error;
    }
  }, []);

  const {
    data: metrics,
    isLoading,
    error,
    refetch,
  } = useQuery<BusinessMetrics>({
    queryKey: ['businessMetrics', businessId],
    queryFn: () => businessId ? fetchBusinessData(businessId) : Promise.resolve(null),
    enabled: !!businessId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle WebSocket updates
  useEffect(() => {
    if (!socket || !businessId) return;

    const handleMetricsUpdate = (data: { businessId: string; metrics: Partial<BusinessMetrics> }) => {
      if (data.businessId === businessId) {
        queryClient.setQueryData<BusinessMetrics>(['businessMetrics', businessId], (oldData) => ({
          ...oldData,
          ...data.metrics,
        }));
        setLastUpdated(new Date());
      }
    };

    const handleNewTransaction = (transaction: any) => {
      if (transaction.businessId === businessId) {
        queryClient.setQueryData<BusinessMetrics>(['businessMetrics', businessId], (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            recentTransactions: [
              {
                id: transaction.id,
                description: transaction.description,
                amount: transaction.amount,
                date: new Date(transaction.date).toLocaleDateString(),
              },
              ...(oldData.recentTransactions?.slice(0, 4) || []),
            ],
          };
        });
      }
    };

    socket.on('metricsUpdate', handleMetricsUpdate);
    socket.on('newTransaction', handleNewTransaction);

    return () => {
      socket.off('metricsUpdate', handleMetricsUpdate);
      socket.off('newTransaction', handleNewTransaction);
    };
  }, [socket, businessId, queryClient]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    if (!businessId) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [businessId, refetch]);

  // Simulate AI insights if not provided by the API
  const enhancedMetrics = useCallback(() => {
    if (!metrics) return metrics;
    
    const defaultInsights = [
      {
        id: 'insight-1',
        title: 'Revenue Growth',
        description: 'Revenue has increased by 12% compared to last month.',
        suggestion: 'Consider increasing your marketing budget to maintain this growth.',
        severity: 'medium' as const,
      },
      {
        id: 'insight-2',
        title: 'User Engagement',
        description: 'User engagement is up by 8% week over week.',
        suggestion: 'Launch a referral program to capitalize on this trend.',
        severity: 'low' as const,
      },
    ];

    return {
      ...metrics,
      aiInsights: metrics.aiInsights?.length ? metrics.aiInsights : defaultInsights,
    };
  }, [metrics]);

  return {
    metrics: enhancedMetrics(),
    isLoading,
    error,
    lastUpdated,
    refetch,
  };
};

export default useBusinessData;
