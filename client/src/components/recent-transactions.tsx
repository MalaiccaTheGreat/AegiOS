import { ArrowUpRight, ArrowDownLeft, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const transactions = [
  {
    id: '1',
    date: '2023-06-15',
    description: 'Payment from Acme Inc',
    amount: 12000,
    type: 'income',
    category: 'Services',
    status: 'completed'
  },
  {
    id: '2',
    date: '2023-06-14',
    description: 'Office Rent',
    amount: 2500,
    type: 'expense',
    category: 'Rent',
    status: 'completed'
  },
  {
    id: '3',
    date: '2023-06-12',
    description: 'Web Hosting',
    amount: 29.99,
    type: 'expense',
    category: 'Technology',
    status: 'pending'
  },
  {
    id: '4',
    date: '2023-06-10',
    description: 'Consulting Services',
    amount: 3500,
    type: 'income',
    category: 'Services',
    status: 'completed'
  },
  {
    id: '5',
    date: '2023-06-08',
    description: 'Software Licenses',
    amount: 499.99,
    type: 'expense',
    category: 'Technology',
    status: 'completed'
  }
]

export function RecentTransactions() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="border-green-500 text-green-500">Completed</Badge>
      case 'pending':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Pending</Badge>
      case 'failed':
        return <Badge variant="outline" className="border-red-500 text-red-500">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[40px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id} className="group">
              <TableCell className="font-medium">
                {formatDate(transaction.date)}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  {transaction.type === 'income' ? (
                    <ArrowDownLeft className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                  )}
                  <span>{transaction.description}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{transaction.category}</Badge>
              </TableCell>
              <TableCell className={`text-right font-medium ${
                transaction.type === 'income' ? 'text-green-500' : 'text-foreground'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </TableCell>
              <TableCell>
                {getStatusBadge(transaction.status)}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-end">
        <Button variant="ghost">
          View all transactions
        </Button>
      </div>
    </div>
  )
}
