import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBusiness } from '@/contexts/BusinessContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText, BarChart, CreditCard, Receipt, FileSpreadsheet } from 'lucide-react';
import FinancialReports from './FinancialReports';
import TaxCenter from './TaxCenter';
import { useFinancialData } from '@/hooks/useFinancialData';
import { RealTimeIndicator } from '@/components/shared/RealTimeIndicator';

const AccountingDashboard = () => {
  const { currentBusiness } = useBusiness();
  const { data: financialData, isLoading, refetch, lastUpdated } = useFinancialData(currentBusiness?.id);
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading || !financialData) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const { summary, metrics } = financialData;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-3xl font-bold tracking-tight">Accounting</h2>
          <RealTimeIndicator lastUpdated={lastUpdated} />
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="mr-2 h-4 w-4" />
            Financial Reports
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <Receipt className="mr-2 h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="tax">
            <CreditCard className="mr-2 h-4 w-4" />
            Tax Center
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${summary.revenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.revenueChange >= 0 ? '+' : ''}{summary.revenueChange}% from last period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${summary.expenses.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.expensesChange >= 0 ? '+' : ''}{summary.expensesChange}% from last period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${summary.profit.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.profitChange >= 0 ? '+' : ''}{summary.profitChange}% from last period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${summary.cashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {summary.cashFlow >= 0 ? '+' : ''}${Math.abs(summary.cashFlow).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.cashFlowChange >= 0 ? '+' : ''}{summary.cashFlowChange}% from last period
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart
                    data={metrics.monthlyMetrics}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="expenses" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                    <Area type="monotone" dataKey="profit" stroke="#ffc658" fill="#ffc658" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Account Balances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.accountBalances.map((account) => (
                    <div key={account.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{account.name}</p>
                        <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className={`text-xs ${account.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {account.change >= 0 ? '↑' : '↓'} {Math.abs(account.change)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <FinancialReports data={metrics.financialReports} />
        </TabsContent>

        <TabsContent value="tax">
          <TaxCenter taxData={metrics.taxData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountingDashboard;
