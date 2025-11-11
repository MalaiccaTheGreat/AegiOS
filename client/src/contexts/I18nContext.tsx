import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type Direction = 'ltr' | 'rtl';

export interface LocaleData {
  code: string;
  name: string;
  nativeName: string;
  direction: Direction;
  dateFormat: string;
  timeFormat: string;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  numberFormat: {
    decimal: string;
    thousand: string;
  };
  currency: {
    symbol: string;
    code: string;
    format: string; // 'symbol' | 'code' | 'name'
  };
  textDirection: Record<Direction, string>;
}

interface I18nContextType {
  locale: string;
  locales: Record<string, LocaleData>;
  t: (key: string, values?: Record<string, any>) => string;
  changeLanguage: (locale: string) => Promise<void>;
  direction: Direction;
  isRTL: boolean;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  loadTranslations: (locale: string) => Promise<void>;
  isLoaded: boolean;
}

// Supported locales with their configurations
const SUPPORTED_LOCALES: Record<string, LocaleData> = {
  'en-US': {
    code: 'en-US',
    name: 'English (US)',
    nativeName: 'English (US)',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'h:mm A',
    firstDayOfWeek: 0, // Sunday
    numberFormat: {
      decimal: '.',
      thousand: ',',
    },
    currency: {
      symbol: '$',
      code: 'USD',
      format: 'symbol',
    },
    textDirection: {
      ltr: 'left to right',
      rtl: 'right to left',
    },
  },
  'ar-SA': {
    code: 'ar-SA',
    name: 'Arabic (Saudi Arabia)',
    nativeName: 'العربية (المملكة العربية السعودية)',
    direction: 'rtl',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'h:mm A',
    firstDayOfWeek: 6, // Saturday
    numberFormat: {
      decimal: '٫',
      thousand: '٬',
    },
    currency: {
      symbol: 'ر.س',
      code: 'SAR',
      format: 'symbol',
    },
    textDirection: {
      ltr: 'من اليسار إلى اليمين',
      rtl: 'من اليمين إلى اليسار',
    },
  },
  'es-ES': {
    code: 'es-ES',
    name: 'Spanish (Spain)',
    nativeName: 'Español (España)',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'H:mm',
    firstDayOfWeek: 1, // Monday
    numberFormat: {
      decimal: ',',
      thousand: '.',
    },
    currency: {
      symbol: '€',
      code: 'EUR',
      format: 'symbol',
    },
    textDirection: {
      ltr: 'izquierda a derecha',
      rtl: 'derecha a izquierda',
    },
  },
  'zh-CN': {
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    direction: 'ltr',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 1, // Monday
    numberFormat: {
      decimal: '.',
      thousand: ',',
    },
    currency: {
      symbol: '¥',
      code: 'CNY',
      format: 'symbol',
    },
    textDirection: {
      ltr: '从左到右',
      rtl: '从右到左',
    },
  },
  'he-IL': {
    code: 'he-IL',
    name: 'Hebrew (Israel)',
    nativeName: 'עברית (ישראל)',
    direction: 'rtl',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    firstDayOfWeek: 0, // Sunday
    numberFormat: {
      decimal: '.',
      thousand: ',',
    },
    currency: {
      symbol: '₪',
      code: 'ILS',
      format: 'symbol',
    },
    textDirection: {
      ltr: 'שמאל לימין',
      rtl: 'מימין לשמאל',
    },
  },
};

// Default translations (can be overridden by loading from an API)
const DEFAULT_TRANSLATIONS: Record<string, Record<string, string>> = {
  'en-US': {
    'app.title': 'AegisOS',
    'app.description': 'A secure and accessible platform',
    'button.submit': 'Submit',
    'button.cancel': 'Cancel',
    'button.next': 'Next',
    'button.previous': 'Previous',
    'error.general': 'An error occurred. Please try again.',
    'error.network': 'Network error. Please check your connection.',
    'loading': 'Loading...',
  },
  'ar-SA': {
    'app.title': 'إيجيس أو إس',
    'app.description': 'منصة آمنة وسهلة الوصول',
    'button.submit': 'إرسال',
    'button.cancel': 'إلغاء',
    'button.next': 'التالي',
    'button.previous': 'السابق',
    'error.general': 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    'error.network': 'خطأ في الشبكة. يرجى التحقق من اتصالك.',
    'loading': 'جاري التحميل...',
  },
  'es-ES': {
    'app.title': 'AegisOS',
    'app.description': 'Una plataforma segura y accesible',
    'button.submit': 'Enviar',
    'button.cancel': 'Cancelar',
    'button.next': 'Siguiente',
    'button.previous': 'Anterior',
    'error.general': 'Se ha producido un error. Por favor, inténtalo de nuevo.',
    'error.network': 'Error de red. Por favor, comprueba tu conexión.',
    'loading': 'Cargando...',
  },
  'zh-CN': {
    'app.title': 'AegisOS',
    'app.description': '一个安全且易于访问的平台',
    'button.submit': '提交',
    'button.cancel': '取消',
    'button.next': '下一步',
    'button.previous': '上一步',
    'error.general': '发生错误，请重试。',
    'error.network': '网络错误，请检查您的连接。',
    'loading': '加载中...',
  },
  'he-IL': {
    'app.title': 'AegisOS',
    'app.description': 'פלטפורמה מאובטחת ונגישה',
    'button.submit': 'שלח',
    'button.cancel': 'בטל',
    'button.next': 'הבא',
    'button.previous': 'הקודם',
    'error.general': 'אירעה שגיאה. אנא נסה שוב.',
    'error.network': 'שגיאת רשת. אנא בדוק את החיבור שלך.',
    'loading': 'טוען...',
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useLocalStorage<string>('i18n-locale', 'en-US');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  
  const currentLocale = SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES['en-US'];
  const direction = currentLocale.direction;
  const isRTL = direction === 'rtl';
  
  // Load translations for the current locale
  const loadTranslations = useCallback(async (localeCode: string) => {
    setIsLoaded(false);
    
    try {
      // In a real app, you would fetch translations from an API
      // const response = await fetch(`/locales/${localeCode}.json`);
      // const data = await response.json();
      // setTranslations(data);
      
      // For now, use the default translations
      setTranslations(DEFAULT_TRANSLATIONS[localeCode] || DEFAULT_TRANSLATIONS['en-US']);
      
      // Update the document direction and lang attribute
      document.documentElement.lang = localeCode;
      document.documentElement.dir = direction;
      
      // Load the appropriate font for the locale
      await loadFontForLocale(localeCode);
      
      setIsLoaded(true);
    } catch (error) {
      console.error(`Failed to load translations for ${localeCode}:`, error);
      setTranslations(DEFAULT_TRANSLATIONS['en-US']);
      setIsLoaded(true);
    }
  }, []);
  
  // Load initial translations
  useEffect(() => {
    loadTranslations(locale);
  }, [locale, loadTranslations]);
  
  // Translation function
  const t = useCallback((key: string, values: Record<string, any> = {}) => {
    let translation = translations[key] || key;
    
    // Replace placeholders with values
    Object.keys(values).forEach((k) => {
      translation = translation.replace(new RegExp(`\\{${k}\\}`, 'g'), values[k]);
    });
    
    return translation;
  }, [translations]);
  
  // Change language
  const changeLanguage = useCallback(async (newLocale: string) => {
    if (SUPPORTED_LOCALES[newLocale]) {
      await loadTranslations(newLocale);
      setLocale(newLocale);
    }
  }, [loadTranslations, setLocale]);
  
  // Format date according to locale
  const formatDate = useCallback((date: Date | string, options: Intl.DateTimeFormatOptions = {}) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }).format(dateObj);
  }, [locale]);
  
  // Format time according to locale
  const formatTime = useCallback((date: Date | string, options: Intl.DateTimeFormatOptions = {}) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      ...options,
    }).format(dateObj);
  }, [locale]);
  
  // Format number according to locale
  const formatNumber = useCallback((num: number, options: Intl.NumberFormatOptions = {}) => {
    return new Intl.NumberFormat(locale, {
      ...options,
    }).format(num);
  }, [locale]);
  
  // Format currency according to locale
  const formatCurrency = useCallback((amount: number, currencyCode?: string) => {
    const currency = currencyCode || currentLocale.currency.code;
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      currencyDisplay: currentLocale.currency.format as any,
    }).format(amount);
  }, [currentLocale.currency, locale]);
  
  // Load appropriate font for the locale
  const loadFontForLocale = async (localeCode: string) => {
    // This is a simplified example - in a real app, you would load the appropriate font
    // based on the locale's script and language requirements
    const fontFaces: Record<string, string> = {
      'ar': 'Tajawal, Arial, sans-serif',
      'he': 'Heebo, Arial, sans-serif',
      'zh': '"Noto Sans SC", "Microsoft YaHei", sans-serif',
      'ja': '"Noto Sans JP", "Hiragino Sans", Meiryo, sans-serif',
      'ko': '"Noto Sans KR", "Malgun Gothic", sans-serif',
      'th': '"Noto Sans Thai", "Tahoma", sans-serif',
    };
    
    const langCode = localeCode.split('-')[0];
    const fontFamily = fontFaces[langCode] || 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    
    // Apply the font to the document
    document.body.style.fontFamily = fontFamily;
    
    // Preload the font if it's a web font
    if (fontFaces[langCode]) {
      const font = new FontFace('locale-font', `local(${fontFaces[langCode].split(',')[0].trim()})`);
      await font.load().catch(() => {
        console.warn(`Failed to load font for locale ${localeCode}`);
      });
    }
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        locales: SUPPORTED_LOCALES,
        t,
        changeLanguage,
        direction,
        isRTL,
        formatDate,
        formatTime,
        formatNumber,
        formatCurrency,
        loadTranslations,
        isLoaded,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Helper hook to use translations
// Example: const { t } = useTranslation();
// Then: t('key', { variable: 'value' });
export function useTranslation() {
  const { t } = useI18n();
  return { t };
}
