import { useState } from 'react';
import { Settings, Info, Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { SettingsDialog } from './SettingsDialog';
import { InfoDialog } from './InfoDialog';
import { useAppStore } from '@/lib/store';
import logoUrl from '@/assets/bubbleteam-logo.jpg';

interface Props { onRefresh: () => void }

export function Header({ onRefresh }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const syncing = useAppStore(s => s.syncing);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/80">
        <div className="flex items-center gap-2">
          <img
            src={logoUrl}
            alt="BubbleTeam"
            className="h-10 w-10 rounded-lg object-cover shadow-sm"
          />
          <span className="font-semibold">BubbleTeam Metrics</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onRefresh} disabled={syncing} aria-label="Обновить">
            <RefreshCw className={syncing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          </Button>
          <a href="https://t.me/bubbleteam" target="_blank" rel="noopener noreferrer"
             className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
             aria-label="Telegram @bubbleteam">
            <Send className="h-4 w-4" />
          </a>
          <Button variant="ghost" size="icon" onClick={() => setInfoOpen(true)} aria-label="Инфо">
            <Info className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)} aria-label="Настройки">
            <Settings className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </header>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <InfoDialog open={infoOpen} onOpenChange={setInfoOpen} />
    </>
  );
}
