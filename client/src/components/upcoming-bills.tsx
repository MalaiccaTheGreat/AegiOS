import { Clock, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const bills = [
  {
    id: '1',
    dueDate: '2023-06-25',
    description: 'Internet Bill',
    amount: 89.99,
    status: 'pending',
    category: 'Utilities'
  },
  {
    id: '2',
    dueDate: '2023-06-28',
    description: 'Electricity Bill',
    amount: 234.56,
    status: 'pending',
    category: 'Utilities'
  },
  {
    id: '3',
    dueDate: '2023-07-01',
    description: 'Office Rent',
    amount: 2500,
    status: 'upcoming',
    category: 'Rent'
  },
  {
    id: '4',
    dueDate: '2023-07-05',
    description: 'Software Subscription',
    amount: 199.99,
    status: 'upcoming',
    category: 'Technology'
  },
  {
    id: '5',
    dueDate: '2023-06-20',
    description: 'Phone Bill',
    amount: 79.99,
    status: 'overdue',
    category: 'Utilities'
  }
]

export function UpcomingBills() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid'
      case 'pending':
        return 'Due soon'
      case 'overdue':
        return 'Overdue'
      default:
        return 'Upcoming'
    }
  }

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Reset time part for accurate date comparison
    today.setHours(0, 0, 0, 0)
    tomorrow.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)

    if (date.getTime() === today.getTime()) {
      return 'Today'
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const getDaysUntilDue = (dateString: string) => {
    const today = new Date()
    const dueDate = new Date(dateString)
    
    // Reset time part for accurate day difference
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`
    return `in ${diffDays} days`
  }

  return (
    <div className="space-y-4">
      {bills.map((bill) => (
        <div 
          key={bill.id} 
          className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors group"
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              bill.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30' :
              bill.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/30' :
              'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              <Calendar className={`h-5 w-5 ${
                bill.status === 'paid' ? 'text-green-600 dark:text-green-400' :
                bill.status === 'overdue' ? 'text-red-600 dark:text-red-400' :
                'text-blue-600 dark:text-blue-400'
              }`} />
            </div>
            <div>
              <p className="text-sm font-medium">{bill.description}</p>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="flex items-center">
                  {getStatusIcon(bill.status)}
                  <span className="ml-1">{getStatusText(bill.status)}</span>
                </span>
                <span className="mx-2">•</span>
                <span>{formatDueDate(bill.dueDate)}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">
              ${bill.amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {getDaysUntilDue(bill.dueDate)}
            </p>
          </div>
        </div>
      ))}
      
      <div className="pt-2">
        <Button variant="outline" className="w-full">
          Add a bill
        </Button>
      </div>
    </div>
  )
}
