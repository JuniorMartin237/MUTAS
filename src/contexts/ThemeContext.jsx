import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Thème (clair/sombre)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // Couleur principale (mutas, rose, citron, orange, rouge)
  const [color, setColor] = useState(() => {
    return localStorage.getItem('color') || 'mutas';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('color', color);
    // Appliquer la couleur principale comme variable CSS
    const root = document.documentElement;
    const colorMap = {
      mutas: '#0EA5E9',
      rose: '#F43F5E',
      citron: '#A3E635',
      orange: '#F97316',
      rouge: '#EF4444',
    };
    root.style.setProperty('--primary-color', colorMap[color]);
    root.style.setProperty('--primary-hover', colorMap[color] + 'cc');
  }, [color]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, color, setColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);