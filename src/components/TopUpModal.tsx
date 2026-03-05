import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, Building2 } from 'lucide-react';
import { formatRupiah } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokoId: string;
  currentKas: number;
  currentRekening: number;
  selisihKas: number;
  onSuccess: () => void;
}

export default function TopUpModal({ open, onOpenChange, tokoId, currentKas, currentRekening, selisihKas, onSuccess }: TopUpModalProps) {
  const [tab, setTab] = useState<'kas' | 'rekening'>('kas');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const presets = [50000, 100000, 200000, 500000, 1000000];

  const handleTopUp = async () => {
    const val = Number(amount);
    if (!val || val <= 0) return;
    setLoading(true);

    const updates: Record<string, number> = {};
    if (tab === 'kas') {
      updates.selisih_kas = (selisihKas || 0) + val;
    } else {
      updates.saldo_rekening_akhir = currentRekening + val;
    }

    const { error } = await supabase
      .from('buka_toko')
      .update(updates)
      .eq('id', tokoId);

    setLoading(false);
    if (error) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil', description: `Top up ${tab === 'kas' ? 'saldo kas' : 'saldo rekening'} ${formatRupiah(val)}` });
      setAmount('');
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center">Top Up Saldo</DialogTitle>
        </DialogHeader>

        {/* Tab */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
          <button
            onClick={() => setTab('kas')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${tab === 'kas' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
          >
            <Wallet className="h-4 w-4" /> Saldo Kas
          </button>
          <button
            onClick={() => setTab('rekening')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${tab === 'rekening' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
          >
            <Building2 className="h-4 w-4" /> Saldo Rekening
          </button>
        </div>

        {/* Current balance */}
        <div className="text-center py-2">
          <p className="text-[10px] text-muted-foreground">Saldo saat ini</p>
          <p className="text-lg font-bold text-foreground">
            {formatRupiah(tab === 'kas' ? currentKas : currentRekening)}
          </p>
        </div>

        {/* Amount input */}
        <Input
          type="number"
          placeholder="Masukkan nominal"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="h-12 text-center text-lg font-bold"
        />

        {/* Presets */}
        <div className="flex flex-wrap gap-2 justify-center">
          {presets.map(p => (
            <button
              key={p}
              onClick={() => setAmount(p.toString())}
              className="px-3 py-1.5 rounded-lg bg-muted text-xs font-medium text-foreground hover:bg-accent transition-colors"
            >
              {formatRupiah(p)}
            </button>
          ))}
        </div>

        <Button onClick={handleTopUp} disabled={loading || !amount || Number(amount) <= 0} className="w-full h-12 gradient-primary text-primary-foreground font-semibold">
          {loading ? 'Memproses...' : `Top Up ${formatRupiah(Number(amount) || 0)}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
