import { ReactNode } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { contexts } from '@/styles/theme';

type BusinessContext = 'accounting' | 'construction' | 'retail';

interface ResponsiveLayoutProps {
  children: ReactNode;
  context?: BusinessContext;
  className?: string;
}

export function ResponsiveLayout({ 
  children, 
  context = 'accounting',
  className 
}: ResponsiveLayoutProps) {
  const { isMobile, isTablet, isDesktop, isUltraWide } = useMediaQuery();
  const contextStyles = contexts[context];

  return (
    <div className={cn(
      'min-h-screen w-full bg-background text-foreground transition-colors duration-300',
      {
        'pb-20': isMobile, // Space for bottom navigation
        'pb-0': !isMobile,
      },
      className
    )}>
      <header className={cn(
        'sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        contextStyles.primary
      )}>
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">AegisOS</h1>
            {!isMobile && (
              <nav className="hidden md:flex items-center space-x-4">
                <a href="#" className="text-sm font-medium hover:opacity-80">Dashboard</a>
                <a href="#" className="text-sm font-medium hover:opacity-80">Reports</a>
                <a href="#" className="text-sm font-medium hover:opacity-80">Analytics</a>
              </nav>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!isMobile && (
              <button className="rounded-full p-2 hover:bg-black/10">
                <span className="sr-only">Search</span>
                <SearchIcon className="h-5 w-5" />
              </button>
            )}
            
            <button className="relative rounded-full p-2 hover:bg-black/10">
              <span className="sr-only">Notifications</span>
              <BellIcon className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            
            {!isMobile && (
              <button className="flex items-center gap-2 rounded-full bg-black/10 px-3 py-1.5 text-sm">
                <UserCircleIcon className="h-5 w-5" />
                <span>Account</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={cn(
        'container mx-auto px-4 py-6',
        {
          'max-w-7xl': isUltraWide,
          'max-w-6xl': isDesktop && !isUltraWide,
          'max-w-4xl': isTablet && !isDesktop,
          'max-w-md': isMobile,
        }
      )}>
        {children}
      </main>

      {isMobile && (
        <MobileBottomNav context={context} />
      )}
    </div>
  );
}

// Mobile Bottom Navigation
function MobileBottomNav({ context }: { context: BusinessContext }) {
  const contextStyles = contexts[context];
  
  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      contextStyles.primary
    )}>
      <div className="flex h-16 items-center justify-around">
        <button className="flex flex-col items-center p-2">
          <HomeIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Home</span>
        </button>
        <button className="flex flex-col items-center p-2">
          <DocumentTextIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Docs</span>
        </button>
        <button className={cn(
          'flex h-12 w-12 -translate-y-4 items-center justify-center rounded-full',
          'text-white shadow-lg',
          contextStyles.accent
        )}>
          <MicrophoneIcon className="h-6 w-6" />
        </button>
        <button className="flex flex-col items-center p-2">
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Chat</span>
        </button>
        <button className="flex flex-col items-center p-2">
          <Cog6ToothIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Settings</span>
        </button>
      </div>
    </nav>
  );
}

// Icons (you can replace these with your preferred icon library)
function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function UserCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function DocumentTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function MicrophoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function ChatBubbleLeftRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function Cog6ToothIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
