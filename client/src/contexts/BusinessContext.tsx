import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Business } from "@/types/business";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export type BusinessContextType = 'accounting' | 'construction' | 'retail' | 'default';

export interface UISettings {
  density: 'compact' | 'normal' | 'comfortable';
  colorScheme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  highContrast: boolean;
}

interface IBusinessContext {
  // Business data
  currentBusiness: Business | null;
  businesses: Business[];
  isLoading: boolean;
  
  // Context-aware UI
  contextType: BusinessContextType;
  setContextType: (context: BusinessContextType) => void;
  
  // UI Settings
  uiSettings: UISettings;
  updateUISettings: (settings: Partial<UISettings>) => void;
  
  // Business management
  setCurrentBusiness: (business: Business | null) => void;
  setBusinesses: (businesses: Business[]) => void;
  refreshBusinesses: () => void;
  
  // Responsive helpers
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isUltraWide: boolean;
}

const BusinessContext = createContext<IBusinessContext | undefined>(undefined);

const defaultUISettings: UISettings = {
  density: 'normal',
  colorScheme: 'system',
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false,
};

export function BusinessProvider({ children }: { children: ReactNode }): JSX.Element {
  const [currentBusiness, _setCurrentBusiness] = useState<Business | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentBusinessId');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [contextType, setContextType] = useState<BusinessContextType>('default');
  const [uiSettings, setUISettings] = useState<UISettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('uiSettings');
      return saved ? JSON.parse(saved) : defaultUISettings;
    }
    return defaultUISettings;
  });
  
  const queryClient = useQueryClient();
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    isUltraWide 
  } = useMediaQuery();

  const { data: businessesData, isLoading, error } = useQuery<Business[]>({
    queryKey: ['businesses'],
    queryFn: async (): Promise<Business[]> => {
      const response = await fetch('/api/businesses');
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        const errorText = await response.text();
        try {
          // Try to parse as JSON for structured error messages
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Failed to fetch businesses');
        } catch {
          // If not JSON, use the raw error text
          throw new Error(errorText || 'Failed to fetch businesses');
        }
      }

      if (!contentType?.includes('application/json')) {
        throw new Error('Received non-JSON response from server');
      }

      return response.json();
    },
    onError: (error) => {
      console.error("Error fetching businesses:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to load businesses');
    },
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    if (businessesData) {
      setBusinesses(businessesData);
      
      // If no current business is set or the current business doesn't exist in the new data
      if (businessesData.length > 0) {
        const businessStillExists = currentBusiness 
          ? businessesData.some((b: Business) => b.id === currentBusiness.id)
          : false;
          
        if (!businessStillExists) {
          setCurrentBusiness(businessesData[0]);
        }
      } else {
        setCurrentBusiness(null);
      }
    }
  }, [businessesData, currentBusiness]);

  const setCurrentBusiness = useCallback((business: Business | null) => {
    _setCurrentBusiness(business);
    if (business) {
      localStorage.setItem('currentBusinessId', JSON.stringify(business.id));
    } else {
      localStorage.removeItem('currentBusinessId');
    }
  }, []);

  const refreshBusinesses = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast.success('Business data refreshed');
    } catch (error) {
      console.error('Error refreshing businesses:', error);
      toast.error('Failed to refresh business data');
    }
  }, [queryClient]);

  // Update UI settings in localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('uiSettings', JSON.stringify(uiSettings));
      
      // Update document classes based on settings
      const html = document.documentElement;
      
      // Handle color scheme
      if (uiSettings.colorScheme === 'dark' || 
          (uiSettings.colorScheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
      
      // Handle reduced motion
      if (uiSettings.reducedMotion) {
        html.classList.add('reduce-motion');
      } else {
        html.classList.remove('reduce-motion');
      }
      
      // Handle high contrast
      if (uiSettings.highContrast) {
        html.classList.add('high-contrast');
      } else {
        html.classList.remove('high-contrast');
      }
      
      // Handle font size
      html.style.fontSize = {
        small: '14px',
        medium: '16px',
        large: '18px',
      }[uiSettings.fontSize];
    }
  }, [uiSettings]);
  
  const updateUISettings = useCallback((settings: Partial<UISettings>) => {
    setUISettings(prev => ({
      ...prev,
      ...settings,
    }));
  }, []);
  
  // Auto-detect business context based on current business
  useEffect(() => {
    if (currentBusiness) {
      const businessType = currentBusiness.type?.toLowerCase();
      if (businessType === 'accounting' || businessType === 'construction' || businessType === 'retail') {
        setContextType(businessType);
      } else {
        setContextType('default');
      }
    }
  }, [currentBusiness]);

  return (
    <BusinessContext.Provider
      value={{
        // Business data
        currentBusiness,
        businesses,
        isLoading,
        
        // Context
        contextType,
        setContextType,
        
        // UI Settings
        uiSettings,
        updateUISettings,
        
        // Business management
        setCurrentBusiness,
        setBusinesses,
        refreshBusinesses,
        
        // Responsive helpers
        isMobile,
        isTablet,
        isDesktop,
        isUltraWide,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness(): IBusinessContext {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error("useBusiness must be used within a BusinessProvider");
  }
  return context;
}

// Helper hook for responsive design
export function useResponsive() {
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    isUltraWide,
    contextType,
    uiSettings 
  } = useBusiness();
  
  // Context-aware UI adjustments
  const contextStyles = {
    accounting: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-blue-100 text-blue-800',
      accent: 'bg-emerald-500',
    },
    construction: {
      primary: 'bg-amber-600 text-white',
      secondary: 'bg-amber-100 text-amber-800',
      accent: 'bg-orange-500',
    },
    retail: {
      primary: 'bg-purple-600 text-white',
      secondary: 'bg-purple-100 text-purple-800',
      accent: 'bg-pink-500',
    },
    default: {
      primary: 'bg-gray-600 text-white',
      secondary: 'bg-gray-100 text-gray-800',
      accent: 'bg-gray-500',
    },
  }[contextType];
  
  // Responsive layout helpers
  const responsiveClass = {
    container: {
      mobile: 'w-full px-2',
      tablet: 'md:max-w-2xl md:mx-auto md:px-4',
      desktop: 'lg:max-w-5xl lg:px-6',
      ultraWide: 'xl:max-w-7xl xl:px-8',
    },
    grid: {
      mobile: 'grid-cols-1',
      tablet: 'md:grid-cols-2',
      desktop: 'lg:grid-cols-3',
      ultraWide: 'xl:grid-cols-4',
    },
  };
  
  // Get appropriate classes based on screen size
  const getResponsiveClasses = (type: keyof typeof responsiveClass) => {
    return [
      responsiveClass[type].mobile,
      isTablet && responsiveClass[type].tablet,
      isDesktop && responsiveClass[type].desktop,
      isUltraWide && responsiveClass[type].ultraWide,
    ].filter(Boolean).join(' ');
  };
  
  return {
    // Screen sizes
    isMobile,
    isTablet,
    isDesktop,
    isUltraWide,
    
    // Context
    contextType,
    contextStyles,
    
    // UI Settings
    uiSettings,
    
    // Responsive helpers
    responsive: {
      container: getResponsiveClasses('container'),
      grid: getResponsiveClasses('grid'),
      class: getResponsiveClasses,
    },
    
    // Touch target sizes
    touchTarget: {
      sm: 'h-10 min-w-[2.5rem] px-3',
      md: 'h-12 min-w-[3rem] px-4',
      lg: 'h-14 min-w-[3.5rem] px-5',
      xl: 'h-16 min-w-[4rem] px-6',
    },
  };
}
