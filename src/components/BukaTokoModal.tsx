import { useState } from 'react';
import { Store, DollarSign, CreditCard, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRupiah } from '@/data/mockData';

interface Props {
  onSubmit: (saldoKas: number, saldoRekening: number, catatan?: string) => void;
}

export default function BukaTokoModal({ onSubmit }: Props) {
  const [saldoKas, setSaldoKas] = useState('');
  const [saldoRekening, setSaldoRekening] = useState('');
  const [catatan, setCatatan] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(Number(saldoKas), Number(saldoRekening), catatan || undefined);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-button">
          <Store className="h-10 w-10 text-primary-foreground" />
        </div>

        <h1 className="text-xl font-bold text-foreground mb-1">Buka Toko Hari Ini</h1>
        <p className="text-sm text-muted-foreground mb-8 text-center">
          Isi saldo awal untuk memulai transaksi hari ini
        </p>

        <div className="w-full space-y-4">
          {/* Saldo Kas */}
          <div>
            <Label className="flex items-center gap-1.5 mb-1.5">
              <DollarSign className="h-3.5 w-3.5 text-secondary" />
              Saldo Kas Awal <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Contoh: 5000000"
              value={saldoKas}
              onChange={(e) => setSaldoKas(e.target.value)}
              className="h-12 text-base"
            />
            {saldoKas && Number(saldoKas) >= 0 && (
              <p className="text-xs text-muted-foreground mt-1">{formatRupiah(Number(saldoKas))}</p>
            )}
            {errors.saldoKas && <p className="text-xs text-destructive mt-1">{errors.saldoKas}</p>}
          </div>

          {/* Saldo Rekening */}
          <div>
            <Label className="flex items-center gap-1.5 mb-1.5">
              <CreditCard className="h-3.5 w-3.5 text-info" />
              Saldo Rekening Awal <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Contoh: 10000000"
              value={saldoRekening}
              onChange={(e) => setSaldoRekening(e.target.value)}
              className="h-12 text-base"
            />
            {saldoRekening && Number(saldoRekening) >= 0 && (
              <p className="text-xs text-muted-foreground mt-1">{formatRupiah(Number(saldoRekening))}</p>
            )}
            {errors.saldoRekening && <p className="text-xs text-destructive mt-1">{errors.saldoRekening}</p>}
          </div>

          {/* Catatan */}
          <div>
            <Label className="flex items-center gap-1.5 mb-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Catatan <span className="text-muted-foreground text-xs">(opsional)</span>
            </Label>
            <Input
              placeholder="Catatan tambahan..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="h-12 text-base"
              maxLength={200}
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full h-12 mt-8 gradient-primary text-primary-foreground font-semibold text-base rounded-xl shadow-button active:scale-95 transition-transform"
        >
          <Store className="h-5 w-5 mr-2" />
          Buka Toko Sekarang
        </Button>
      </div>
    </div>
  );
}
