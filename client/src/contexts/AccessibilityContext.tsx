import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type ColorScheme = 'light' | 'dark' | 'high-contrast' | 'system';
type MotionPreference = 'full' | 'reduced' | 'none';
type TextSize = 'small' | 'normal' | 'large' | 'xlarge';
type KeyboardNavigation = 'standard' | 'keyboard-only';

export interface AccessibilitySettings {
  colorScheme: ColorScheme;
  motionPreference: MotionPreference;
  textSize: TextSize;
  keyboardNavigation: KeyboardNavigation;
  reducedTransparency: boolean;
  highlightFocus: boolean;
  showFocusRings: boolean;
  customFocusColor?: string;
  customFont?: string;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  linkUnderline: boolean;
  grayscale: boolean;
}

interface AccessibilityContextType extends AccessibilitySettings {
  setColorScheme: (scheme: ColorScheme) => void;
  setMotionPreference: (preference: MotionPreference) => void;
  setTextSize: (size: TextSize) => void;
  setKeyboardNavigation: (mode: KeyboardNavigation) => void;
  setReducedTransparency: (reduced: boolean) => void;
  setHighlightFocus: (highlight: boolean) => void;
  setShowFocusRings: (show: boolean) => void;
  setCustomFocusColor: (color?: string) => void;
  setCustomFont: (font?: string) => void;
  setLineHeight: (height: number) => void;
  setLetterSpacing: (spacing: number) => void;
  setWordSpacing: (spacing: number) => void;
  setLinkUnderline: (underline: boolean) => void;
  setGrayscale: (grayscale: boolean) => void;
  resetToDefaults: () => void;
  isKeyboardUser: boolean;
  isReducedMotion: boolean;
  isHighContrast: boolean;
  isDarkMode: boolean;
}

const defaultSettings: AccessibilitySettings = {
  colorScheme: 'system',
  motionPreference: 'full',
  textSize: 'normal',
  keyboardNavigation: 'standard',
  reducedTransparency: false,
  highlightFocus: true,
  showFocusRings: true,
  lineHeight: 1.5,
  letterSpacing: 0,
  wordSpacing: 0,
  linkUnderline: true,
  grayscale: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage<AccessibilitySettings>('a11y-settings', defaultSettings);
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
  
  // Detect system preferences
  const systemPrefersDark = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const systemPrefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Derived states
  const isDarkMode = settings.colorScheme === 'dark' || 
    (settings.colorScheme === 'system' && systemPrefersDark);
  const isHighContrast = settings.colorScheme === 'high-contrast';
  const isReducedMotion = settings.motionPreference === 'reduced' || 
    (settings.motionPreference === 'system' && systemPrefersReducedMotion);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply color scheme
    root.classList.toggle('dark', isDarkMode);
    root.classList.toggle('high-contrast', isHighContrast);
    
    // Apply motion preferences
    root.classList.toggle('reduced-motion', isReducedMotion);
    
    // Apply text size
    const textSizes = {
      small: '0.875rem',
      normal: '1rem',
      large: '1.125rem',
      xlarge: '1.25rem',
    };
    root.style.setProperty('--text-size', textSizes[settings.textSize]);
    
    // Apply custom properties
    root.style.setProperty('--line-height', String(settings.lineHeight));
    root.style.setProperty('--letter-spacing', `${settings.letterSpacing}px`);
    root.style.setProperty('--word-spacing', `${settings.wordSpacing}px`);
    root.style.setProperty('--link-underline', settings.linkUnderline ? 'underline' : 'none');
    root.style.setProperty('--grayscale', settings.grayscale ? '100%' : '0%');
    
    if (settings.customFont) {
      document.body.style.fontFamily = `${settings.customFont}, system-ui, sans-serif`;
    } else {
      document.body.style.fontFamily = '';
    }
    
    // Set document title for screen readers when page changes
    const observer = new MutationObserver(() => {
      const mainHeading = document.querySelector('h1, [role="heading"][aria-level="1"]');
      if (mainHeading) {
        document.title = `${mainHeading.textContent || 'AegisOS'}`;
      }
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    
    return () => observer.disconnect();
  }, [settings, isDarkMode, isHighContrast, isReducedMotion]);
  
  // Detect keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
        document.body.classList.add('keyboard-navigation');
      }
    };
    
    const handleMouseDown = () => {
      setIsKeyboardUser(false);
      document.body.classList.remove('keyboard-navigation');
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
  
  // Update settings
  const updateSettings = useCallback((updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
    }));
  }, [setSettings]);
  
  const resetToDefaults = useCallback(() => {
    setSettings(defaultSettings);
  }, [setSettings]);

  return (
    <AccessibilityContext.Provider
      value={{
        ...settings,
        setColorScheme: (scheme) => updateSettings({ colorScheme: scheme }),
        setMotionPreference: (preference) => updateSettings({ motionPreference: preference }),
        setTextSize: (size) => updateSettings({ textSize: size }),
        setKeyboardNavigation: (mode) => updateSettings({ keyboardNavigation: mode }),
        setReducedTransparency: (reduced) => updateSettings({ reducedTransparency: reduced }),
        setHighlightFocus: (highlight) => updateSettings({ highlightFocus: highlight }),
        setShowFocusRings: (show) => updateSettings({ showFocusRings: show }),
        setCustomFocusColor: (color) => updateSettings({ customFocusColor: color }),
        setCustomFont: (font) => updateSettings({ customFont: font }),
        setLineHeight: (height) => updateSettings({ lineHeight: height }),
        setLetterSpacing: (spacing) => updateSettings({ letterSpacing: spacing }),
        setWordSpacing: (spacing) => updateSettings({ wordSpacing: spacing }),
        setLinkUnderline: (underline) => updateSettings({ linkUnderline: underline }),
        setGrayscale: (grayscale) => updateSettings({ grayscale }),
        resetToDefaults,
        isKeyboardUser: isKeyboardUser || settings.keyboardNavigation === 'keyboard-only',
        isReducedMotion,
        isHighContrast,
        isDarkMode,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Helper hook for local storage with type safety
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
