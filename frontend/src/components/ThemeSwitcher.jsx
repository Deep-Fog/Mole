import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const ThemeSwitcher = () => {
  // Determine initial theme safely
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemPrefersDark ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Sync DOM with state
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = (e) => {
    e.stopPropagation(); // Prevent any parent handlers
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative z-50 flex items-center justify-center rounded-full bg-white/10 p-2 text-slate-600 shadow-sm backdrop-blur-md transition-all hover:bg-white/20 hover:text-slate-900 active:scale-95 dark:bg-black/20 dark:text-slate-400 dark:hover:bg-black/40 dark:hover:text-white"
      aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

export default ThemeSwitcher;
