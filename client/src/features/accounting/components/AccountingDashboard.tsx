import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, BarChart, CreditCard, DollarSign, TrendingUp, TrendingDown, FileText, FileSpreadsheet } from 'lucide-react';

interface FinancialSummary {
  revenue: number;
  expenses: number;
  profit: number;
  cashFlow: number;
  revenueChange: number;
  expensesChange: number;
  profitChange: number;
  cashFlowChange: number;
}

export function AccountingDashboard() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Replace with actual API call
        // const response = await fetch('/api/accounting/summary');
        // const data = await response.json();
        // setSummary(data);
        
        // Mock data for now
        setTimeout(() => {
          setSummary({
            revenue: 12500,
            expenses: 8500,
            profit: 4000,
            cashFlow: 3800,
            revenueChange: 12.5,
            expensesChange: 8.2,
            profitChange: 20.3,
            cashFlowChange: 15.7,
          });
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load financial data');
        toast({
          title: 'Error',
          description: 'Failed to fetch accounting data',
          variant: 'destructive',
        });
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const renderMetricCard = (title: string, value: number, change: number, icon: React.ReactNode) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(value)}
        </div>
        <p className={`text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'} mt-1`}>
          {!loading && (
            <>
              {change > 0 ? '↑' : '↓'} {Math.abs(change)}% from last period
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Accounting Dashboard</h1>
        <div className="space-x-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Reports
          </Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Transaction
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="taxes">Taxes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {renderMetricCard(
              'Total Revenue',
              summary?.revenue || 0,
              summary?.revenueChange || 0,
              <DollarSign className="h-4 w-4" />
            )}
            {renderMetricCard(
              'Expenses',
              summary?.expenses || 0,
              summary?.expensesChange || 0,
              <CreditCard className="h-4 w-4" />
            )}
            {renderMetricCard(
              'Profit',
              summary?.profit || 0,
              summary?.profitChange || 0,
              <TrendingUp className="h-4 w-4" />
            )}
            {renderMetricCard(
              'Cash Flow',
              summary?.cashFlow || 0,
              summary?.cashFlowChange || 0,
              <TrendingDown className="h-4 w-4" />
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                {/* Chart would go here */}
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <BarChart className="h-12 w-12 mr-2" />
                  <span>Revenue vs Expenses Chart</span>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {loading ? <Skeleton className="h-4 w-24" /> : `Transaction ${i}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {!loading && `Category ${i}`}
                        </p>
                      </div>
                      <div className="font-medium">
                        {loading ? (
                          <Skeleton className="h-4 w-16" />
                        ) : (
                          formatCurrency(i % 2 === 0 ? 100 * i : -50 * i)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
