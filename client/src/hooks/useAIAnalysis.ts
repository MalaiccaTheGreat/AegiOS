import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useBusiness } from '@/contexts/BusinessContext';
import { useEffect } from 'react';

interface AIInsights {
  businessId: number;
  predictions: {
    revenueForecast: Array<{ date: string; amount: number }>;
    busyPeriods: Array<{ start: string; end: string; intensity: number }>;
  };
  recommendations: string[];
  anomalies: Array<{
    type: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

interface PredictionResponse {
  predictions: any[];
}

interface BusinessHealth {
  score: number;
  status: 'healthy' | 'needs_attention' | 'critical';
  lastUpdated: string;
}

export const useAIAnalysis = () => {
  const { currentBusiness } = useBusiness();
  const queryClient = useQueryClient();

  // Get AI insights for the current business
  const insightsQuery = useQuery<AIInsights>({
    queryKey: ['ai-insights', currentBusiness?.id],
    queryFn: async () => {
      if (!currentBusiness) throw new Error('No business selected');
      const response = await fetch(`/api/ai/business/${currentBusiness.id}/insights`);
      if (!response.ok) throw new Error('Failed to fetch AI insights');
      return response.json();
    },
    enabled: !!currentBusiness,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get predictions for the current business
  const predictionsQuery = useQuery<PredictionResponse>({
    queryKey: ['ai-predictions', currentBusiness?.id],
    queryFn: async () => {
      if (!currentBusiness) throw new Error('No business selected');
      const response = await fetch(
        `/api/ai/predictions/revenue?businessId=${currentBusiness.id}`
      );
      if (!response.ok) throw new Error('Failed to fetch predictions');
      return response.json();
    },
    enabled: !!currentBusiness,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Get business health score
  const healthQuery = useQuery<BusinessHealth>({
    queryKey: ['business-health', currentBusiness?.id],
    queryFn: async () => {
      if (!currentBusiness) throw new Error('No business selected');
      const response = await fetch(`/api/ai/business/${currentBusiness.id}/health`);
      if (!response.ok) throw new Error('Failed to fetch business health');
      return response.json();
    },
    enabled: !!currentBusiness,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Prefetch data when business changes
  useEffect(() => {
    if (currentBusiness) {
      // Prefetch insights and predictions when business changes
      queryClient.prefetchQuery({
        queryKey: ['ai-insights', currentBusiness.id],
        queryFn: async () => {
          const response = await fetch(`/api/ai/business/${currentBusiness.id}/insights`);
          if (!response.ok) throw new Error('Failed to prefetch insights');
          return response.json();
        },
      });

      queryClient.prefetchQuery({
        queryKey: ['ai-predictions', currentBusiness.id],
        queryFn: async () => {
          const response = await fetch(
            `/api/ai/predictions/revenue?businessId=${currentBusiness.id}`
          );
          if (!response.ok) throw new Error('Failed to prefetch predictions');
          return response.json();
        },
      });
    }
  }, [currentBusiness, queryClient]);

  // Refresh all AI data
  const refreshAll = async () => {
    await Promise.all([
      insightsQuery.refetch(),
      predictionsQuery.refetch(),
      healthQuery.refetch(),
    ]);
  };

  return {
    // Data
    insights: insightsQuery.data,
    predictions: predictionsQuery.data?.predictions || [],
    health: healthQuery.data,
    
    // Loading states
    isLoading: insightsQuery.isLoading || predictionsQuery.isLoading || healthQuery.isLoading,
    isRefreshing: insightsQuery.isRefetching || predictionsQuery.isRefetching || healthQuery.isRefetching,
    
    // Errors
    error: insightsQuery.error || predictionsQuery.error || healthQuery.error,
    
    // Actions
    refreshAll,
    refreshInsights: insightsQuery.refetch,
    refreshPredictions: predictionsQuery.refetch,
    refreshHealth: healthQuery.refetch,
  };
};
