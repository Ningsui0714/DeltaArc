import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type UiLanguage = 'zh' | 'en';

type UiLanguageContextValue = {
  language: UiLanguage;
  setLanguage: (language: UiLanguage) => void;
};

const storageKey = 'wind-tunnel-ui-language';

const UiLanguageContext = createContext<UiLanguageContextValue | null>(null);

function readStoredLanguage(): UiLanguage {
  if (typeof window === 'undefined') {
    return 'zh';
  }

  const savedLanguage = window.localStorage.getItem(storageKey);
  return savedLanguage === 'en' ? 'en' : 'zh';
}

export function UiLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<UiLanguage>(readStoredLanguage);

  useEffect(() => {
    window.localStorage.setItem(storageKey, language);
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
  }, [language]);

  return <UiLanguageContext.Provider value={{ language, setLanguage }}>{children}</UiLanguageContext.Provider>;
}

export function useUiLanguage() {
  const context = useContext(UiLanguageContext);

  if (!context) {
    throw new Error('useUiLanguage must be used within UiLanguageProvider');
  }

  return context;
}

export function isEnglishUi(language: UiLanguage) {
  return language === 'en';
}

export function pickUiCopy<T>(language: UiLanguage, zhCopy: T, enCopy: T) {
  return language === 'en' ? enCopy : zhCopy;
}
