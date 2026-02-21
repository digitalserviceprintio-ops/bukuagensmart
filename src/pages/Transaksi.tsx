import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Wallet, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatRupiah, calculateFee } from '@/data/mockData';

type TxType = 'tarik' | 'setor' | 'transfer';

const txTypes: { type: TxType; label: string; icon: typeof ArrowDownLeft; gradient: string }[] = [
  { type: 'tarik', label: 'Tarik Tunai', icon: ArrowDownLeft, gradient: 'gradient-primary' },
  { type: 'setor', label: 'Setor Tunai', icon: ArrowUpRight, gradient: 'gradient-success' },
  { type: 'transfer', label: 'Transfer', icon: Wallet, gradient: 'gradient-primary' },
];

export default function Transaksi() {
  const [selectedType, setSelectedType] = useState<TxType>('tarik');
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const numAmount = parseInt(amount.replace(/\D/g, '')) || 0;
  const { fee, commission } = calculateFee(selectedType, numAmount);

  const handleAmountChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    setAmount(digits ? parseInt(digits).toLocaleString('id-ID') : '');
  };

  const handleSubmit = () => {
    if (numAmount < 10000 || !customerName) return;
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setAmount('');
      setCustomerName('');
      setCustomerPhone('');
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 pb-20">
        <div className="animate-slide-up text-center">
          <CheckCircle className="h-20 w-20 text-secondary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-1">Transaksi Berhasil!</h2>
          <p className="text-muted-foreground text-sm">
            {txTypes.find(t => t.type === selectedType)?.label} sebesar {formatRupiah(numAmount)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      <h1 className="text-lg font-bold text-foreground mb-4">Transaksi Baru</h1>

      {/* Type Selector */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {txTypes.map((tx) => (
          <button
            key={tx.type}
            onClick={() => setSelectedType(tx.type)}
            className={`rounded-xl p-3 flex flex-col items-center gap-1.5 transition-all border-2 ${
              selectedType === tx.type
                ? `${tx.gradient} border-transparent shadow-button`
                : 'bg-card border-border'
            }`}
          >
            <tx.icon className={`h-5 w-5 ${selectedType === tx.type ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
            <span className={`text-xs font-semibold ${selectedType === tx.type ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
              {tx.label}
            </span>
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Nama Pelanggan</label>
          <Input
            placeholder="Nama lengkap"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="h-12 text-base"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">No. HP Pelanggan</label>
          <Input
            type="tel"
            placeholder="08xxxxxxxxxx"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="h-12 text-base"
            maxLength={15}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Nominal</label>
          <Input
            placeholder="0"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="h-14 text-2xl font-bold text-center"
            inputMode="numeric"
          />
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {[50000, 100000, 200000, 500000].map((val) => (
            <button
              key={val}
              onClick={() => handleAmountChange(val.toString())}
              className="bg-muted rounded-lg py-2 text-xs font-medium text-foreground active:scale-95 transition-transform"
            >
              {formatRupiah(val)}
            </button>
          ))}
        </div>

        {/* Fee Summary */}
        {numAmount > 0 && (
          <div className="bg-card rounded-xl p-4 space-y-2 shadow-card animate-fade-in border border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Biaya Admin</span>
              <span className="font-medium text-foreground">{formatRupiah(fee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Komisi Agen</span>
              <span className="font-medium text-secondary">{formatRupiah(commission)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-sm">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-foreground">{formatRupiah(numAmount + fee)}</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={numAmount < 10000 || !customerName}
          className="w-full h-14 text-base font-semibold gradient-primary shadow-button disabled:opacity-50"
        >
          Proses {txTypes.find(t => t.type === selectedType)?.label}
        </Button>
      </div>
    </div>
  );
}
