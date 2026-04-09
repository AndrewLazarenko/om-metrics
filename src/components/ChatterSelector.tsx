import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Chatter { id: number; name: string }

interface Props {
  chatters: Chatter[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export function ChatterSelector({ chatters, selectedId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chatters;
    return chatters.filter(c => c.name.toLowerCase().includes(q));
  }, [chatters, query]);

  const selected = chatters.find(c => c.id === selectedId) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="button"
          className="w-64 justify-between"
        >
          <span className="truncate">{selected ? selected.name : 'Выбери чатера'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center border-b border-slate-200 px-3 py-2 dark:border-slate-800">
          <Search className="mr-2 h-4 w-4 opacity-50" />
          <Input
            placeholder="Поиск чатера…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="h-8 border-0 p-0 shadow-none focus-visible:ring-0"
            data-hotkey="search"
            autoFocus
          />
        </div>
        <ul className="max-h-72 overflow-y-auto p-1">
          <li>
            <button
              type="button"
              onClick={() => { onSelect(null); setOpen(false); }}
              className={cn(
                'flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800',
                selectedId === null && 'bg-slate-100 dark:bg-slate-800',
              )}
            >
              <span>Все чатеры</span>
              {selectedId === null && <Check className="h-4 w-4" />}
            </button>
          </li>
          {filtered.map(c => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => { onSelect(c.id); setOpen(false); }}
                className={cn(
                  'flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800',
                  c.id === selectedId && 'bg-slate-100 dark:bg-slate-800',
                )}
              >
                <span className="truncate">{c.name}</span>
                {c.id === selectedId && <Check className="h-4 w-4" />}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-2 py-3 text-center text-xs text-slate-500">Ничего не найдено</li>
          )}
        </ul>
        <div className="border-t border-slate-200 px-3 py-1.5 text-xs text-slate-500 dark:border-slate-800">
          {filtered.length} из {chatters.length}
        </div>
      </PopoverContent>
    </Popover>
  );
}
