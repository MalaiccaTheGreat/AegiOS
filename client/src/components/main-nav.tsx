'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BusinessSelector } from './business-selector'
import { ThemeToggle } from './theme-toggle'
import { UserNav } from './user-nav'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
  },
  {
    href: '/documents',
    label: 'Documents',
  },
  {
    href: '/accounting',
    label: 'Accounting',
  },
  {
    href: '/reports',
    label: 'Reports',
  },
  {
    href: '/settings',
    label: 'Settings',
  },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <div className="flex h-16 items-center border-b px-4">
      <div className="flex items-center space-x-6">
        <Link
          href="/"
          className="flex items-center space-x-2"
        >
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-xl font-bold text-transparent">
            AegisOS
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname?.startsWith(item.href))
              
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-foreground/80',
                  isActive ? 'text-foreground' : 'text-foreground/60',
                  'relative group'
                )}
              >
                {item.label}
                <span 
                  className={cn(
                    'absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300',
                    isActive ? 'w-full' : 'group-hover:w-1/2'
                  )}
                />
              </Link>
            )
          })}
        </nav>
      </div>
      
      <div className="ml-auto flex items-center space-x-4">
        <ThemeToggle />
        <BusinessSelector />
        <UserNav />
      </div>
    </div>
  )
}
