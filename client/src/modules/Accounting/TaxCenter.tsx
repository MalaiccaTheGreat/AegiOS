import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Download, FileText, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface TaxFiling {
  id: string;
  name: string;
  type: 'federal' | 'state' | 'local' | 'sales' | 'property' | 'payroll' | 'other';
  dueDate: string;
  status: 'not_started' | 'in_progress' | 'filed' | 'paid' | 'overdue';
  amountDue: number;
  amountPaid: number;
  progress: number;
  documents: { name: string; type: string; size: string; uploadedAt: string }[];
}

interface TaxCenterProps {
  taxData: {
    upcomingFiling: TaxFiling | null;
    recentFilings: TaxFiling[];
    taxSummary: {
      totalPaid: number;
      totalDue: number;
      totalUpcoming: number;
      taxSavings: number;
      estimatedRefund: number;
    };
  };
}

const TaxCenter = ({ taxData }: TaxCenterProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { upcomingFiling, recentFilings, taxSummary } = taxData;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'filed':
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {status.replace('_', ' ')}
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Not Started
          </Badge>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const daysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-medium">Tax Center</h3>
          <p className="text-sm text-muted-foreground">
            Manage your tax filings, track payments, and view important deadlines
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Tax Documents
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Tax Data
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="filings">Filings</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="planning">Tax Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tax Due</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(taxSummary.totalDue)}</div>
                <p className="text-xs text-muted-foreground">
                  {taxSummary.totalDue > 0 ? 'Payment due' : 'No payment due'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Payment</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(taxSummary.totalUpcoming)}</div>
                <p className="text-xs text-muted-foreground">
                  {upcomingFiling ? `${daysUntilDue(upcomingFiling.dueDate)} days until due` : 'No upcoming payments'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tax Savings</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(taxSummary.taxSavings)}</div>
                <p className="text-xs text-muted-foreground">Potential savings identified</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estimated Refund</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(taxSummary.estimatedRefund)}</div>
                <p className="text-xs text-muted-foreground">Based on current data</p>
              </CardContent>
            </Card>
          </div>

          {upcomingFiling && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Upcoming Tax Filing</CardTitle>
                    <CardDescription>
                      Next deadline: {new Date(upcomingFiling.dueDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={daysUntilDue(upcomingFiling.dueDate) <= 14 ? 'destructive' : 'default'}>
                    {daysUntilDue(upcomingFiling.dueDate)} days left
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{upcomingFiling.name}</h4>
                      <span className="text-sm font-medium">
                        {formatCurrency(upcomingFiling.amountDue - upcomingFiling.amountPaid)} due
                      </span>
                    </div>
                    <Progress value={upcomingFiling.progress} className="h-2" />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>{upcomingFiling.progress}% complete</span>
                      <span>
                        {formatCurrency(upcomingFiling.amountPaid)} of {formatCurrency(upcomingFiling.amountDue)} paid
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    <Button size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download Forms
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Recent Tax Filings</CardTitle>
              <CardDescription>Your most recent tax filings and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filing</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentFilings.map((filing) => (
                    <TableRow key={filing.id}>
                      <TableCell className="font-medium">{filing.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {filing.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(filing.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(filing.status)}</TableCell>
                      <TableCell className="text-right">
                        {filing.status === 'paid' ? (
                          <span className="text-green-600">{formatCurrency(filing.amountPaid)}</span>
                        ) : (
                          <span className="font-medium">{formatCurrency(filing.amountDue)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">View filing</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filings">
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Tax Filings</CardTitle>
                  <CardDescription>Manage all your tax filings in one place</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Filing
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filing Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentFilings.map((filing) => (
                      <TableRow key={filing.id}>
                        <TableCell className="font-medium">{filing.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {filing.type}
                          </Badge>
                        </TableCell>
                        <TableCell>Q1 2023</TableCell>
                        <TableCell>{new Date(filing.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(filing.status)}</TableCell>
                        <TableCell className="text-right">
                          {filing.status === 'paid' ? (
                            <span className="text-green-600">{formatCurrency(filing.amountPaid)}</span>
                          ) : (
                            <span className="font-medium">
                              {formatCurrency(filing.amountDue - filing.amountPaid)} due
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <FileText className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaxCenter;
