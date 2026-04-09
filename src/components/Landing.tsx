import { useState } from 'react';
import { Send, Lock, Zap, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { validateToken, OmApiError } from '@/lib/om-api';

export function Landing() {
  const setToken = useAppStore(s => s.setToken);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = value.trim();
    if (!token) {
      setError('Вставь токен');
      return;
    }
    setBusy(true);
    try {
      await validateToken(token);
      // Persist the token. App.tsx's useAutoSync will notice the token
      // change and dispatch runInitialSync (first time) automatically.
      setToken(token);
    } catch (err) {
      if (err instanceof OmApiError && (err.status === 401 || err.status === 403)) {
        setError('Токен невалидный. Проверь и попробуй ещё раз.');
      } else {
        setError('Не удалось проверить токен. Проверь сеть.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-pink-500/10"
      />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-12">
        <h1 className="mb-3 text-center text-4xl font-bold tracking-tight sm:text-5xl">
          OnlyMonster Chatter Metrics
        </h1>
        <p className="mb-10 max-w-lg text-center text-base text-slate-500 dark:text-slate-400">
          Локальный дашборд для агентств. Твой токен и данные живут только в браузере.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3">
          <Label htmlFor="om-token">OnlyMonster Auth Token</Label>
          <Input
            id="om-token"
            type="password"
            autoComplete="off"
            placeholder="om_token_..."
            value={value}
            onChange={e => setValue(e.target.value)}
            className={error ? 'border-red-500 focus-visible:ring-red-400' : ''}
            disabled={busy}
            autoFocus
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Проверяю…' : 'Загрузить данные'}
          </Button>
        </form>

        <div className="mt-12 grid w-full max-w-md grid-cols-3 gap-3 text-center text-xs">
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <Lock className="mx-auto mb-1 h-4 w-4" />
            Приватно
          </div>
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <Zap className="mx-auto mb-1 h-4 w-4" />
            Быстро
          </div>
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <Gift className="mx-auto mb-1 h-4 w-4" />
            Бесплатно
          </div>
        </div>

        <a
          href="https://t.me/bubbleteam"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <Send className="h-4 w-4" />
          Made by @bubbleteam
        </a>
      </div>
    </div>
  );
}
