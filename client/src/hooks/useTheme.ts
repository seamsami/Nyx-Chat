import { useState, useEffect, useCallback } from 'react';
import { Theme } from '../types';

const defaultLightTheme: Theme = {
  id: 'light',
  name: 'Light',
  type: 'light',
  colors: {
    primary: '#6366f1',
    secondary: '#ec4899',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: 'rgba(0, 0, 0, 0.1)',
    accent: '#fbbf24',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  fonts: {
    primary: 'Inter, sans-serif',
    secondary: 'Inter, sans-serif',
    mono: 'JetBrains Mono, monospace',
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      xxl: '1.5rem',
    },
  },
  effects: {
    blur: 20,
    transparency: 0.7,
    shadows: true,
    gradients: true,
    particles: true,
  },
  animations: {
    enabled: true,
    duration: 300,
    easing: 'ease-out',
    reducedMotion: false,
  },
};

const defaultDarkTheme: Theme = {
  id: 'dark',
  name: 'Dark',
  type: 'dark',
  colors: {
    primary: '#6366f1',
    secondary: '#ec4899',
    background: '#0f0f23',
    surface: '#1a1a2e',
    text: '#ffffff',
    textSecondary: '#a1a1aa',
    border: 'rgba(255, 255, 255, 0.1)',
    accent: '#fbbf24',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  fonts: {
    primary: 'Inter, sans-serif',
    secondary: 'Inter, sans-serif',
    mono: 'JetBrains Mono, monospace',
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      xxl: '1.5rem',
    },
  },
  effects: {
    blur: 20,
    transparency: 0.05,
    shadows: true,
    gradients: true,
    particles: true,
  },
  animations: {
    enabled: true,
    duration: 300,
    easing: 'ease-out',
    reducedMotion: false,
  },
};

const customThemes: Theme[] = [
  {
    id: 'neon',
    name: 'Neon',
    type: 'dark',
    colors: {
      primary: '#00ff88',
      secondary: '#ff0080',
      background: '#000011',
      surface: '#001122',
      text: '#00ff88',
      textSecondary: '#88ffaa',
      border: 'rgba(0, 255, 136, 0.3)',
      accent: '#ffff00',
      success: '#00ff88',
      warning: '#ffaa00',
      error: '#ff0080',
      info: '#0088ff',
    },
    fonts: defaultDarkTheme.fonts,
    effects: {
      blur: 15,
      transparency: 0.1,
      shadows: true,
      gradients: true,
      particles: true,
    },
    animations: {
      enabled: true,
      duration: 200,
      easing: 'ease-in-out',
      reducedMotion: false,
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    type: 'dark',
    colors: {
      primary: '#ff6b35',
      secondary: '#f7931e',
      background: '#1a0e0a',
      surface: '#2d1b16',
      text: '#fff8f0',
      textSecondary: '#d4a574',
      border: 'rgba(255, 107, 53, 0.2)',
      accent: '#ffcc02',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3',
    },
    fonts: defaultDarkTheme.fonts,
    effects: {
      blur: 25,
      transparency: 0.08,
      shadows: true,
      gradients: true,
      particles: true,
    },
    animations: {
      enabled: true,
      duration: 400,
      easing: 'ease-out',
      reducedMotion: false,
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    type: 'dark',
    colors: {
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      background: '#0c1821',
      surface: '#1e3a5f',
      text: '#e0f2fe',
      textSecondary: '#87ceeb',
      border: 'rgba(14, 165, 233, 0.2)',
      accent: '#38bdf8',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    fonts: defaultDarkTheme.fonts,
    effects: {
      blur: 30,
      transparency: 0.06,
      shadows: true,
      gradients: true,
      particles: true,
    },
    animations: {
      enabled: true,
      duration: 350,
      easing: 'ease-in-out',
      reducedMotion: false,
    },
  },
];

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(defaultDarkTheme);
  const [availableThemes] = useState<Theme[]>([
    defaultLightTheme,
    defaultDarkTheme,
    ...customThemes,
  ]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedThemeId = localStorage.getItem('nyx-theme');
    const savedCustomTheme = localStorage.getItem('nyx-custom-theme');

    if (savedCustomTheme) {
      try {
        const customTheme = JSON.parse(savedCustomTheme);
        setTheme(customTheme);
        applyThemeToDOM(customTheme);
        return;
      } catch (error) {
        console.error('Failed to parse custom theme:', error);
      }
    }

    if (savedThemeId) {
      const foundTheme = availableThemes.find(t => t.id === savedThemeId);
      if (foundTheme) {
        setTheme(foundTheme);
        applyThemeToDOM(foundTheme);
        return;
      }
    }

    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemTheme = prefersDark ? defaultDarkTheme : defaultLightTheme;
    setTheme(systemTheme);
    applyThemeToDOM(systemTheme);
  }, [availableThemes]);

  // Apply theme to DOM
  const applyThemeToDOM = useCallback((themeToApply: Theme) => {
    const root = document.documentElement;
    
    // Set CSS custom properties
    Object.entries(themeToApply.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
    });

    // Set font properties
    root.style.setProperty('--font-primary', themeToApply.fonts.primary);
    root.style.setProperty('--font-secondary', themeToApply.fonts.secondary);
    root.style.setProperty('--font-mono', themeToApply.fonts.mono);

    Object.entries(themeToApply.fonts.sizes).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });

    // Set effect properties
    root.style.setProperty('--glass-blur', `${themeToApply.effects.blur}px`);
    root.style.setProperty('--glass-transparency', themeToApply.effects.transparency.toString());

    // Set animation properties
    root.style.setProperty('--animation-duration', `${themeToApply.animations.duration}ms`);
    root.style.setProperty('--animation-easing', themeToApply.animations.easing);

    // Set data attribute for theme type
    document.body.setAttribute('data-theme', themeToApply.type);

    // Handle reduced motion
    if (themeToApply.animations.reducedMotion) {
      root.style.setProperty('--animation-duration', '0ms');
    }
  }, []);

  // Change theme
  const changeTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    applyThemeToDOM(newTheme);
    localStorage.setItem('nyx-theme', newTheme.id);
    localStorage.removeItem('nyx-custom-theme');
  }, [applyThemeToDOM]);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const newTheme = theme.type === 'dark' ? defaultLightTheme : defaultDarkTheme;
    changeTheme(newTheme);
  }, [theme.type, changeTheme]);

  // Create custom theme
  const createCustomTheme = useCallback((customTheme: Partial<Theme>) => {
    const newTheme: Theme = {
      ...theme,
      ...customTheme,
      id: 'custom',
      name: 'Custom',
      type: customTheme.type || theme.type,
      colors: { ...theme.colors, ...customTheme.colors },
      fonts: { ...theme.fonts, ...customTheme.fonts },
      effects: { ...theme.effects, ...customTheme.effects },
      animations: { ...theme.animations, ...customTheme.animations },
    };

    setTheme(newTheme);
    applyThemeToDOM(newTheme);
    localStorage.setItem('nyx-custom-theme', JSON.stringify(newTheme));
    localStorage.removeItem('nyx-theme');

    return newTheme;
  }, [theme, applyThemeToDOM]);

  // Update theme property
  const updateThemeProperty = useCallback((path: string, value: any) => {
    const pathArray = path.split('.');
    const updatedTheme = { ...theme };
    
    let current: any = updatedTheme;
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    current[pathArray[pathArray.length - 1]] = value;

    setTheme(updatedTheme);
    applyThemeToDOM(updatedTheme);
    
    if (updatedTheme.id === 'custom') {
      localStorage.setItem('nyx-custom-theme', JSON.stringify(updatedTheme));
    }
  }, [theme, applyThemeToDOM]);

  // Reset to default theme
  const resetTheme = useCallback(() => {
    changeTheme(defaultDarkTheme);
  }, [changeTheme]);

  // Export theme
  const exportTheme = useCallback(() => {
    const themeData = JSON.stringify(theme, null, 2);
    const blob = new Blob([themeData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `nyx-theme-${theme.name.toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [theme]);

  // Import theme
  const importTheme = useCallback((file: File): Promise<Theme> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const themeData = JSON.parse(e.target?.result as string);
          const importedTheme = createCustomTheme(themeData);
          resolve(importedTheme);
        } catch (error) {
          reject(new Error('Invalid theme file'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [createCustomTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme.id === 'light' || theme.id === 'dark') {
        const systemTheme = e.matches ? defaultDarkTheme : defaultLightTheme;
        changeTheme(systemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme.id, changeTheme]);

  // Listen for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      updateThemeProperty('animations.reducedMotion', e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [updateThemeProperty]);

  return {
    theme,
    availableThemes,
    changeTheme,
    toggleTheme,
    createCustomTheme,
    updateThemeProperty,
    resetTheme,
    exportTheme,
    importTheme,
  };
};