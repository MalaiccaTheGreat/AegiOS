'use client'

import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const businesses = [
  { id: '1', name: 'Acme Corp', industry: 'Technology' },
  { id: '2', name: 'Globex', industry: 'Manufacturing' },
  { id: '3', name: 'Soylent', industry: 'Food & Beverage' },
]

export function BusinessSelector() {
  const [currentBusiness, setCurrentBusiness] = useState(businesses[0])
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-14 px-4 hover:bg-accent/50"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="font-medium">{currentBusiness.name.charAt(0)}</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">{currentBusiness.name}</p>
              <p className="text-xs text-muted-foreground">{currentBusiness.industry}</p>
            </div>
          </div>
          <ChevronDown 
            className={cn(
              'h-4 w-4 transition-transform',
              open ? 'rotate-180' : ''
            )} 
          />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-[240px] p-2" align="start" side="right">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Your Businesses
        </div>
        
        {businesses.map((business) => (
          <DropdownMenuItem
            key={business.id}
            onClick={() => {
              setCurrentBusiness(business)
              setOpen(false)
            }}
            className={cn(
              'flex items-center space-x-2 cursor-pointer px-2 py-2 rounded-md',
              currentBusiness.id === business.id ? 'bg-accent' : 'hover:bg-accent/50'
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <span className="text-sm font-medium">{business.name.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm font-medium">{business.name}</p>
              <p className="text-xs text-muted-foreground">{business.industry}</p>
            </div>
          </DropdownMenuItem>
        ))}
        
        <div className="border-t border-border my-2" />
        
        <DropdownMenuItem className="text-primary font-medium px-2 py-2 hover:bg-accent/50 rounded-md">
          <Plus className="h-4 w-4 mr-2" />
          <span>Add New Business</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
