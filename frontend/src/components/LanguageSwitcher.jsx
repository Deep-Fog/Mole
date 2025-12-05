import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="relative flex items-center justify-center rounded-full bg-white/10 p-2 text-slate-600 shadow-sm backdrop-blur-md transition-all hover:bg-white/20 hover:text-slate-900 active:scale-95 dark:bg-black/20 dark:text-slate-400 dark:hover:bg-black/40 dark:hover:text-white"
      aria-label="Toggle Language"
      title={i18n.language === 'en' ? 'Switch to Chinese' : 'Switch to English'}
    >
      <Globe size={20} />
      <span className="ml-1 text-sm font-medium">{i18n.language.toUpperCase()}</span>
    </button>
  );
};

export default LanguageSwitcher;