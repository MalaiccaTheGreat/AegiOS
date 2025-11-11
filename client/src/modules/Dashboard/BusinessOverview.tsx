import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBusiness } from '@/contexts/BusinessContext';
import { useBusinessData } from '@/hooks/useBusinessData';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, TrendingUp, Clock } from 'lucide-react';
import { RealTimeIndicator } from '@/components/shared/RealTimeIndicator';

const BusinessOverview = () => {
  const { currentBusiness } = useBusiness();
  const { metrics, isLoading, lastUpdated } = useBusinessData(currentBusiness?.id);

  if (!currentBusiness) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Business Selected</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please select a business to view its overview.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const kpiData = [
    {
      title: 'Total Revenue',
      value: `$${metrics?.revenue?.toLocaleString() || '0'}`,
      change: metrics?.revenueChange || 0,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Active Users',
      value: metrics?.activeUsers?.toLocaleString() || '0',
      change: metrics?.userGrowth || 0,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Conversion Rate',
      value: `${metrics?.conversionRate?.toFixed(1)}%` || '0%',
      change: metrics?.conversionChange || 0,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Avg. Response Time',
      value: `${metrics?.avgResponseTime || 0}m`,
      change: metrics?.responseTimeChange || 0,
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{currentBusiness.name}</h3>
          <p className="text-sm text-muted-foreground">
            {currentBusiness.industry} • {currentBusiness.location}
          </p>
        </div>
        <RealTimeIndicator lastUpdated={lastUpdated} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className={`text-xs ${kpi.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {kpi.change >= 0 ? '↑' : '↓'} {Math.abs(kpi.change)}% from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.revenueData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.userActivityData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="activeUsers" name="Active Users" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="newUsers" name="New Users" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.recentTransactions?.length ? (
              <div className="space-y-4">
                {metrics.recentTransactions.map((txn, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{txn.description}</p>
                      <p className="text-sm text-muted-foreground">{txn.date}</p>
                    </div>
                    <p className={`font-medium ${txn.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {txn.amount >= 0 ? '+' : '-'}${Math.abs(txn.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent transactions</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics?.aiInsights?.length ? (
              <div className="space-y-4">
                {metrics.aiInsights.map((insight, i) => (
                  <div key={i} className="space-y-1">
                    <p className="font-medium">{insight.title}</p>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    {insight.suggestion && (
                      <p className="text-sm text-blue-500">Suggestion: {insight.suggestion}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No insights available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessOverview;
