import React, { createContext, useContext, useEffect } from 'react';
import { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  theme: Theme;
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ theme, children }) => {
  useEffect(() => {
    // Apply theme to document root
    const root = document.documentElement;
    
    // Set CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });

    // Set font properties
    root.style.setProperty('--font-primary', theme.fonts.primary);
    root.style.setProperty('--font-secondary', theme.fonts.secondary);
    root.style.setProperty('--font-mono', theme.fonts.mono);

    Object.entries(theme.fonts.sizes).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });

    // Set effect properties
    root.style.setProperty('--glass-blur', `${theme.effects.blur}px`);
    root.style.setProperty('--glass-transparency', theme.effects.transparency.toString());

    // Set animation properties
    root.style.setProperty('--animation-duration', `${theme.animations.duration}ms`);
    root.style.setProperty('--animation-easing', theme.animations.easing);

    // Set data attribute for theme type
    document.body.setAttribute('data-theme', theme.type);

    // Handle reduced motion
    if (theme.animations.reducedMotion) {
      root.style.setProperty('--animation-duration', '0ms');
    }
  }, [theme]);

  const contextValue: ThemeContextType = {
    theme,
    setTheme: () => {}, // This will be handled by the parent component
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;