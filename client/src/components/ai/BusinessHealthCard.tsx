import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { AlertCircle, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export function BusinessHealthCard() {
  const { health, isLoading } = useAIAnalysis();

  if (isLoading || !health) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Business Health</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-24">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'needs_attention':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (health.status) {
      case 'healthy': return 'Healthy';
      case 'needs_attention': return 'Needs Attention';
      default: return 'Critical';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Business Health</CardTitle>
          {getStatusIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold">{health.score}</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              health.status === 'healthy' ? 'bg-green-100 text-green-800' :
              health.status === 'needs_attention' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {getStatusText()}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                health.status === 'healthy' ? 'bg-green-500' :
                health.status === 'needs_attention' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${health.score}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(health.lastUpdated).toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
