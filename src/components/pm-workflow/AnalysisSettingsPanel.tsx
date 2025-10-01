import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlatformDataService } from '@/services/PlatformDataService';
import { AnalysisSettings, defaultAnalysisSettings } from '@/services/DiscoveryAnalysisService';
import { Settings } from 'lucide-react';

interface AnalysisSettingsPanelProps {
  sessionId: string;
  onSaved?: (settings: AnalysisSettings) => void;
}

export const AnalysisSettingsPanel: React.FC<AnalysisSettingsPanelProps> = ({ sessionId, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AnalysisSettings>(defaultAnalysisSettings());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await PlatformDataService.getAnalysisSettings(sessionId);
        if (mounted) {
          if (result.data) setSettings({ ...defaultAnalysisSettings(), ...(result.data || {}) });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [sessionId]);

  const save = async () => {
    setSaving(true);
    try {
      await PlatformDataService.saveAnalysisSettings(sessionId, settings);
      onSaved?.(settings);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const Num = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={e => onChange(Number(e.target.value))} />
    </div>
  );

  return (
    <div className="relative">
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(s => !s)}>
        <Settings className="h-4 w-4" />
        Analysis Settings
      </Button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[440px]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Analysis Benchmarks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Num label="CPU warn %" value={settings.cpu.warning} onChange={v => setSettings(s => ({ ...s, cpu: { ...s.cpu, warning: v } }))} />
                    <Num label="CPU critical %" value={settings.cpu.critical} onChange={v => setSettings(s => ({ ...s, cpu: { ...s.cpu, critical: v } }))} />
                    <Num label="Heap warn %" value={settings.heap.warning} onChange={v => setSettings(s => ({ ...s, heap: { ...s.heap, warning: v } }))} />
                    <Num label="Heap critical %" value={settings.heap.critical} onChange={v => setSettings(s => ({ ...s, heap: { ...s.heap, critical: v } }))} />
                    <Num label="RAM free min % (Supervisor)" value={settings.ram.minFreePctSupervisor} onChange={v => setSettings(s => ({ ...s, ram: { ...s.ram, minFreePctSupervisor: v } }))} />
                    <Num label="RAM free min % (JACE)" value={settings.ram.minFreePctJace} onChange={v => setSettings(s => ({ ...s, ram: { ...s.ram, minFreePctJace: v } }))} />
                    <Num label="Disk free min % (Supervisor)" value={settings.disk.minFreePctSupervisor} onChange={v => setSettings(s => ({ ...s, disk: { ...s.disk, minFreePctSupervisor: v } }))} />
                    <Num label="Disk free min % (JACE)" value={settings.disk.minFreePctJace} onChange={v => setSettings(s => ({ ...s, disk: { ...s.disk, minFreePctJace: v } }))} />
                    <Num label="JACE histories max" value={settings.histories.jaceMax} onChange={v => setSettings(s => ({ ...s, histories: { ...s.histories, jaceMax: v } }))} />
                    <Num label="Supervisor histories max" value={settings.histories.supervisorMax} onChange={v => setSettings(s => ({ ...s, histories: { ...s.histories, supervisorMax: v } }))} />
                    <Num label="Cert expiring days" value={settings.certificates.expiringDays} onChange={v => setSettings(s => ({ ...s, certificates: { ...s.certificates, expiringDays: v } }))} />
                    <Num label="License warn %" value={settings.license.warnPct} onChange={v => setSettings(s => ({ ...s, license: { ...s.license, warnPct: v } }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Niagara current LTS</Label>
                    <Input value={settings.niagara.currentLTS} onChange={e => setSettings(s => ({ ...s, niagara: { ...s.niagara, currentLTS: e.target.value } }))} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
                    <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save & Recompute'}</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};