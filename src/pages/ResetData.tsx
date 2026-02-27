import { useState } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const resetOptions = [
  { key: 'transactions', label: 'Data Transaksi', desc: 'Hapus semua riwayat transaksi' },
  { key: 'cash_book', label: 'Buku Kas', desc: 'Hapus semua catatan buku kas' },
  { key: 'buka_toko', label: 'Data Buka/Tutup Toko', desc: 'Hapus semua riwayat buka toko' },
];

export default function ResetData() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggle = (key: string) => {
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const handleReset = async () => {
    if (!confirming) { setConfirming(true); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      for (const table of selected) {
        await supabase.from(table as any).delete().eq('user_id', user.id);
      }
      toast({ title: 'Data berhasil direset' });
      setSelected([]);
      setConfirming(false);
    } catch (err: any) {
      toast({ title: 'Gagal reset data', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>
      <h1 className="text-lg font-bold text-foreground mb-1">Reset Data</h1>
      <p className="text-sm text-muted-foreground mb-4">Pilih data yang ingin dihapus</p>

      <div className="space-y-2 mb-6">
        {resetOptions.map((opt) => (
          <button key={opt.key} onClick={() => { toggle(opt.key); setConfirming(false); }}
            className={`w-full bg-card rounded-xl p-4 flex items-center gap-3 shadow-card text-left border-2 transition-colors ${selected.includes(opt.key) ? 'border-destructive' : 'border-transparent'}`}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selected.includes(opt.key) ? 'bg-destructive border-destructive' : 'border-muted-foreground'}`}>
              {selected.includes(opt.key) && <span className="text-destructive-foreground text-xs">✓</span>}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{opt.label}</p>
              <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {confirming && (
        <div className="bg-destructive/10 rounded-xl p-4 mb-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Peringatan!</p>
            <p className="text-xs text-destructive/80">Data yang dihapus tidak dapat dikembalikan. Klik sekali lagi untuk konfirmasi.</p>
          </div>
        </div>
      )}

      <Button onClick={handleReset} disabled={selected.length === 0 || submitting} variant="destructive" className="w-full h-12">
        {submitting ? 'Menghapus...' : confirming ? 'Konfirmasi Hapus' : 'Reset Data Terpilih'}
      </Button>
    </div>
  );
}
