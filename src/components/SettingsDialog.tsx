import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: Props) {
  const settings = useAppStore(s => s.settings);
  const updateSettings = useAppStore(s => s.updateSettings);
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={save} disabled={!valid}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
