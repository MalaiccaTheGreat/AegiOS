import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Lightbulb, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export function InsightsPanel({ className }: { className?: string }) {
  const { 
    insights, 
    predictions, 
    health, 
    isLoading, 
    isRefreshing, 
    error, 
    refreshAll 
  } = useAIAnalysis();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Update last updated time when data changes
  useEffect(() => {
    if (!isLoading && !isRefreshing && (insights || predictions || health)) {
      setLastUpdated(new Date());
    }
  }, [isLoading, isRefreshing, insights, predictions, health]);

  const handleRefresh = async () => {
    await refreshAll();
  };

  // Health status colors
  const getHealthColor = (status?: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'needs_attention': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading && !insights && !predictions) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>Analyzing your business data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load AI insights. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Insights</h2>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Business Health */}
      {health && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Business Health</CardTitle>
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                getHealthColor(health.status)
              )}>
                {health.status.replace('_', ' ')}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Score</span>
                <span className="font-medium">{health.score}/100</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full",
                    health.status === 'healthy' ? 'bg-green-500' : 
                    health.status === 'needs_attention' ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${health.score}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date(health.lastUpdated).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anomalies */}
      {insights?.anomalies && insights.anomalies.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-lg">Attention Needed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.anomalies.map((anomaly, i) => (
              <Alert 
                key={i} 
                variant={anomaly.impact === 'high' ? 'destructive' : 'default'}
                className="items-start"
              >
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <div>
                  <AlertTitle>{anomaly.type}</AlertTitle>
                  <AlertDescription>{anomaly.description}</AlertDescription>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {insights?.recommendations && insights.recommendations.length > 0 ? (
              insights.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 h-2 w-2 mt-2 rounded-full bg-blue-500" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground text-sm">No recommendations at this time.</li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Revenue Forecast */}
      {predictions && predictions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Revenue Forecast</CardTitle>
            </div>
            <CardDescription>Next 6 months projection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {predictions.map((month: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{new Date(month.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    <span className="font-medium">${month.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-green-600"
                      style={{ width: `${Math.min(100, (month.amount / 10000) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
