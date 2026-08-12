import React, { useState, useEffect } from 'react';
import { ThemeContext } from './theme-context';
import type { Theme } from './theme-context';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('kyros-theme') as Theme) || 'system';
  });

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('kyros-theme', newTheme);
    setThemeState(newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else if (theme === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    } else {
      root.classList.remove('dark-theme');
      root.classList.remove('light-theme');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
