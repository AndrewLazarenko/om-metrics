import { Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { clearAll } from '@/lib/db';
import { useAppStore } from '@/lib/store';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function InfoDialog({ open, onOpenChange }: Props) {
  const clearTokenAction = useAppStore(s => s.clearTokenAction);
  const setSelectedUserId = useAppStore(s => s.setSelectedUserId);

  async function handleWipe() {
    if (!confirm('Стереть все данные (токен, метрики, настройки)? Это нельзя отменить.')) return;
    await clearAll();
    clearTokenAction();
    setSelectedUserId(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>О приложении</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p>
            <strong>Что это.</strong> Локальный дашборд для агентств на OnlyFans/Fansly, которые используют
            OnlyMonster. Вставь свой auth-token — получи две heatmap-таблицы с метриками за последние 20 дней.
          </p>
          <p>
            <strong>Где живут данные.</strong> Токен — в <code>localStorage</code> твоего браузера.
            Метрики — в <code>IndexedDB</code>. Ни одного запроса на наши сервера нет. Открой
            DevTools → Network и убедись сам.
          </p>
          <div>
            <strong>Как получить OM токен.</strong>
            <ol className="mt-1 list-inside list-decimal space-y-1 text-slate-500">
              <li>Открой свой OM-дашборд в браузере</li>
              <li>F12 → вкладка Network → обнови страницу</li>
              <li>Найди любой запрос к <code>omapi.onlymonster.ai</code></li>
              <li>В заголовках скопируй значение <code>x-om-auth-token</code></li>
            </ol>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button variant="destructive" onClick={handleWipe}>
              Очистить все данные
            </Button>
            <a
              href="https://t.me/bubbleteam"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700"
            >
              <Send className="h-4 w-4" /> Made by @bubbleteam
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
