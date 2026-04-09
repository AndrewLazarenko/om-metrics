import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

/**
 * Applies the `dark` class on <html> whenever settings.theme changes.
 * Call once in App.
 */
export function useTheme(): void {
  const theme = useAppStore(s => s.settings.theme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);
}
