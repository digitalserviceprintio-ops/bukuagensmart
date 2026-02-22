import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, CreditCard, Store, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatRupiah } from '@/data/mockData';
import type { BukaToko } from '@/hooks/useToko';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokoData: BukaToko;
  onTutup: (saldoKasAkhir: number, saldoRekeningAkhir: number) => Promise<BukaToko | null>;
}

export default function TutupTokoDialog({ open, onOpenChange, tokoData, onTutup }: Props) {
  const [saldoKas, setSaldoKas] = useState('');
  const [saldoRekening, setSaldoRekening] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<BukaToko | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    const kas = Number(saldoKas);
    const rek = Number(saldoRekening);
    if (!saldoKas || isNaN(kas)) e.saldoKas = 'Wajib diisi';
    else if (kas < 0) e.saldoKas = 'Tidak boleh minus';
    if (!saldoRekening || isNaN(rek)) e.saldoRekening = 'Wajib diisi';
    else if (rek < 0) e.saldoRekening = 'Tidak boleh minus';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleTutup = async () => {
    if (!validate()) return;
    setLoading(true);
    const res = await onTutup(Number(saldoKas), Number(saldoRekening));
    if (res) setResult(res);
    setLoading(false);
  };

  const selisihKas = result ? (Number(result.saldo_kas_akhir!) - Number(result.saldo_kas_awal)) : 0;
  const selisihRekening = result ? (Number(result.saldo_rekening_akhir!) - Number(result.saldo_rekening_awal)) : 0;

  const SelisihIcon = selisihKas > 0 ? TrendingUp : selisihKas < 0 ? TrendingDown : Minus;

  if (result) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-secondary" /> Toko Ditutup
            </DialogTitle>
            <DialogDescription>Laporan harian berhasil dibuat</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="bg-muted rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo Kas Awal</span>
                <span className="font-medium text-foreground">{formatRupiah(Number(result.saldo_kas_awal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo Kas Akhir</span>
                <span className="font-medium text-foreground">{formatRupiah(Number(result.saldo_kas_akhir!))}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <SelisihIcon className="h-3.5 w-3.5" /> Selisih Kas
                </span>
                <span className={`font-bold ${selisihKas >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                  {selisihKas >= 0 ? '+' : ''}{formatRupiah(selisihKas)}
                </span>
              </div>
            </div>
            <div className="bg-muted rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo Rekening Awal</span>
                <span className="font-medium text-foreground">{formatRupiah(Number(result.saldo_rekening_awal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo Rekening Akhir</span>
                <span className="font-medium text-foreground">{formatRupiah(Number(result.saldo_rekening_akhir!))}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="text-muted-foreground">Selisih Rekening</span>
                <span className={`font-bold ${selisihRekening >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                  {selisihRekening >= 0 ? '+' : ''}{formatRupiah(selisihRekening)}
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              Buka: {new Date(result.waktu_buka).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} — 
              Tutup: {new Date(result.waktu_tutup!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <Button onClick={() => { setResult(null); onOpenChange(false); }} className="w-full mt-2 gradient-primary text-primary-foreground rounded-xl h-11">
            Selesai
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-destructive" /> Tutup Toko
          </DialogTitle>
          <DialogDescription>Masukkan saldo akhir untuk menutup toko hari ini</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="flex items-center gap-1.5 mb-1.5 text-sm">
              <DollarSign className="h-3.5 w-3.5 text-secondary" /> Saldo Kas Akhir
            </Label>
            <Input type="number" inputMode="numeric" placeholder="Saldo kas saat ini" value={saldoKas} onChange={(e) => setSaldoKas(e.target.value)} className="h-11" />
            {errors.saldoKas && <p className="text-xs text-destructive mt-1">{errors.saldoKas}</p>}
          </div>
          <div>
            <Label className="flex items-center gap-1.5 mb-1.5 text-sm">
              <CreditCard className="h-3.5 w-3.5 text-info" /> Saldo Rekening Akhir
            </Label>
            <Input type="number" inputMode="numeric" placeholder="Saldo rekening saat ini" value={saldoRekening} onChange={(e) => setSaldoRekening(e.target.value)} className="h-11" />
            {errors.saldoRekening && <p className="text-xs text-destructive mt-1">{errors.saldoRekening}</p>}
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-11 rounded-xl">Batal</Button>
          <Button onClick={handleTutup} disabled={loading} className="flex-1 h-11 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {loading ? 'Memproses...' : 'Tutup Toko'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
