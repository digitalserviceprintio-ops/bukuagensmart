import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { formatRupiah } from '@/data/mockData';

interface FeeRule {
  label: string;
  minAmount: number;
  maxAmount: number;
  fee: number;
  commission: number;
}

const defaultRules: FeeRule[] = [
  { label: 'Rp 10.000 - Rp 100.000', minAmount: 10000, maxAmount: 100000, fee: 2500, commission: 1500 },
  { label: 'Rp 100.001 - Rp 500.000', minAmount: 100001, maxAmount: 500000, fee: 5000, commission: 3500 },
  { label: 'Rp 500.001 - Rp 1.000.000', minAmount: 500001, maxAmount: 1000000, fee: 7500, commission: 5000 },
  { label: 'Rp 1.000.001 - Rp 5.000.000', minAmount: 1000001, maxAmount: 5000000, fee: 10000, commission: 7000 },
  { label: 'Di atas Rp 5.000.000', minAmount: 5000001, maxAmount: 999999999, fee: 15000, commission: 10000 },
];

export default function AturBiayaAdmin() {
  const navigate = useNavigate();
  const stored = localStorage.getItem('fee_rules');
  const [rules, setRules] = useState<FeeRule[]>(stored ? JSON.parse(stored) : defaultRules);

  const updateRule = (idx: number, field: 'fee' | 'commission', value: string) => {
    const updated = [...rules];
    updated[idx] = { ...updated[idx], [field]: parseInt(value.replace(/\D/g, '')) || 0 };
    setRules(updated);
  };

  const handleSave = () => {
    localStorage.setItem('fee_rules', JSON.stringify(rules));
    toast({ title: 'Biaya admin berhasil disimpan' });
  };

  const handleReset = () => {
    setRules(defaultRules);
    localStorage.removeItem('fee_rules');
    toast({ title: 'Biaya admin dikembalikan ke default' });
  };

  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>
      <h1 className="text-lg font-bold text-foreground mb-1">Atur Biaya Admin</h1>
      <p className="text-sm text-muted-foreground mb-4">Biaya dihitung per kelipatan nominal transaksi</p>

      <div className="space-y-3">
        {rules.map((rule, idx) => (
          <div key={idx} className="bg-card rounded-xl p-4 shadow-card space-y-3">
            <p className="text-sm font-semibold text-foreground">{rule.label}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Biaya Admin</label>
                <Input value={rule.fee.toLocaleString('id-ID')} onChange={(e) => updateRule(idx, 'fee', e.target.value)} className="h-10 text-sm" inputMode="numeric" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Komisi Agen</label>
                <Input value={rule.commission.toLocaleString('id-ID')} onChange={(e) => updateRule(idx, 'commission', e.target.value)} className="h-10 text-sm" inputMode="numeric" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <Button onClick={handleSave} className="w-full h-12 gradient-primary shadow-button">Simpan</Button>
        <Button onClick={handleReset} variant="outline" className="w-full h-12">Reset ke Default</Button>
      </div>
    </div>
  );
}
