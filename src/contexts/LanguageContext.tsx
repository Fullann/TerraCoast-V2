import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { Language, translate, detectUserLanguage } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  showAllLanguages: boolean;
  setShowAllLanguages: (show: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [language, setLanguageState] = useState<Language>('fr');
  const [showAllLanguages, setShowAllLanguagesState] = useState(false);

  useEffect(() => {
    if (profile) {
      setLanguageState((profile.language as Language) || 'fr');
      setShowAllLanguagesState(profile.show_all_languages || false);
    } else {
      const detectedLang = detectUserLanguage();
      setLanguageState(detectedLang);
    }
  }, [profile]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    if (profile) {
      await supabase
        .from('profiles')
        .update({ language: lang })
        .eq('id', profile.id);
    }
  };

  const setShowAllLanguages = async (show: boolean) => {
    setShowAllLanguagesState(show);
    if (profile) {
      await supabase
        .from('profiles')
        .update({ show_all_languages: show })
        .eq('id', profile.id);
    }
  };

  const t = (key: string) => translate(key, language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, showAllLanguages, setShowAllLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
