import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { clearAll } from '@/lib/db';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: Props) {
  const settings = useAppStore(s => s.settings);
  const updateSettings = useAppStore(s => s.updateSettings);
  const clearTokenAction = useAppStore(s => s.clearTokenAction);
  const setSelectedUserId = useAppStore(s => s.setSelectedUserId);
  const [shift, setShift] = useState(String(settings.shiftHours));
  const [commission, setCommission] = useState(String(settings.commissionRate));

  useEffect(() => {
    setShift(String(settings.shiftHours));
    setCommission(String(settings.commissionRate));
  }, [open, settings]);

  const shiftNum = Number(shift);
  const commissionNum = Number(commission);
  const valid =
    Number.isFinite(shiftNum) && shiftNum > 0 &&
    Number.isFinite(commissionNum) && commissionNum >= 0 && commissionNum <= 1;

  function save() {
    if (!valid) return;
    updateSettings({ shiftHours: shiftNum, commissionRate: commissionNum });
    onOpenChange(false);
  }

  async function handleWipe() {
    if (!confirm('Стереть все данные (токен, метрики, настройки)? Это нельзя отменить.')) return;
    await clearAll();
    clearTokenAction();
    setSelectedUserId(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Настройки</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="shift">Длина смены (часов)</Label>
            <Input
              id="shift"
              type="number"
              min={1}
              max={24}
              step={0.5}
              value={shift}
              onChange={e => setShift(e.target.value)}
              className={shiftNum <= 0 || !Number.isFinite(shiftNum) ? 'border-red-500' : ''}
            />
            <p className="mt-1 text-xs text-slate-500">Используется для Msg/Hour и Chat/Hour.</p>
          </div>

          <div>
            <Label htmlFor="commission">Комиссия платформы (0..1)</Label>
            <Input
              id="commission"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={commission}
              onChange={e => setCommission(e.target.value)}
              className={!Number.isFinite(commissionNum) || commissionNum < 0 || commissionNum > 1 ? 'border-red-500' : ''}
            />
            <p className="mt-1 text-xs text-slate-500">OnlyFans = 0.20, Fansly = 0.15, etc.</p>
          </div>

          <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <Label className="text-slate-600 dark:text-slate-400">Данные</Label>
            <p className="mb-2 mt-1 text-xs text-slate-500">
              Удалит токен, все метрики и настройки из этого браузера.
            </p>
            <Button variant="destructive" size="sm" onClick={handleWipe} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Отключить токен и очистить данные
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={save} disabled={!valid}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
