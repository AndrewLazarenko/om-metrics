import { Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const theme = useAppStore(s => s.settings.theme);
  const updateSettings = useAppStore(s => s.updateSettings);
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => updateSettings({ theme: next })}
      aria-label={`Переключить на ${next}`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
