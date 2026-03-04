import { useState } from 'react';
import { ArrowLeft, Crown, Clock, Check, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLicense } from '@/hooks/useLicense';
import { toast } from '@/hooks/use-toast';
import { formatRupiah } from '@/data/mockData';

export default function Lisensi() {
  const navigate = useNavigate();
  const { license, loading, isPremium, isTrial, isExpired, daysLeft, activateCode } = useLicense();
  const [code, setCode] = useState('');
  const [activating, setActivating] = useState(false);

  const handleActivate = async () => {
    if (!code.trim()) return;
    setActivating(true);
    const error = await activateCode(code.trim());
    setActivating(false);
    if (error) {
      toast({ title: 'Gagal', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil!', description: 'Lisensi premium berhasil diaktifkan' });
      setCode('');
    }
  };

  if (loading) return null;

  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-3 shadow-button">
          <Crown className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Lisensi Aplikasi</h1>
        <p className="text-sm text-muted-foreground">Status langganan Anda</p>
      </div>

      {/* Current Status */}
      <div className={`rounded-2xl p-5 mb-6 ${isPremium ? 'bg-secondary/10 border-2 border-secondary' : isExpired ? 'bg-destructive/10 border-2 border-destructive' : 'bg-warning/10 border-2 border-warning'}`}>
        <div className="flex items-center gap-3 mb-2">
          {isPremium ? (
            <Sparkles className="h-6 w-6 text-secondary" />
          ) : (
            <Clock className="h-6 w-6 text-warning" />
          )}
          <div>
            <p className="text-base font-bold text-foreground">
              {isPremium
                ? license?.license_type === 'lifetime' ? 'Premium Selamanya' : 'Premium Bulanan'
                : 'Trial'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isPremium && license?.license_type === 'lifetime'
                ? 'Aktif selamanya'
                : isExpired
                  ? 'Masa aktif habis'
                  : daysLeft !== null
                    ? `${daysLeft} hari tersisa`
                    : 'Aktif'}
            </p>
          </div>
        </div>
        {license?.activation_code && (
          <p className="text-[10px] text-muted-foreground">Kode: {license.activation_code}</p>
        )}
      </div>

      {/* Pricing */}
      {!isPremium && (
        <div className="space-y-3 mb-6">
          <h2 className="text-sm font-semibold text-foreground">Upgrade ke Premium</h2>

          <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-bold text-foreground">Bulanan</p>
                <p className="text-[10px] text-muted-foreground">Perpanjang setiap bulan</p>
              </div>
              <p className="text-lg font-bold text-primary">{formatRupiah(16999)}<span className="text-xs text-muted-foreground">/bln</span></p>
            </div>
            <div className="space-y-1">
              {['Semua fitur premium', 'Tanpa batas transaksi', 'Support prioritas'].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-secondary" />
                  <span className="text-xs text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-card border-2 border-secondary relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
              HEMAT
            </div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-bold text-foreground">Selamanya</p>
                <p className="text-[10px] text-muted-foreground">Bayar sekali, pakai selamanya</p>
              </div>
              <p className="text-lg font-bold text-secondary">{formatRupiah(55999)}</p>
            </div>
            <div className="space-y-1">
              {['Semua fitur premium', 'Tanpa batas transaksi', 'Support prioritas', 'Update gratis selamanya'].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-secondary" />
                  <span className="text-xs text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activation Code */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <h3 className="text-sm font-semibold text-foreground mb-3">Masukkan Kode Aktivasi</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Hubungi developer untuk mendapatkan kode aktivasi premium.
        </p>
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX-XXXX"
            className="flex-1 h-12 uppercase tracking-widest font-mono"
            maxLength={20}
          />
          <Button onClick={handleActivate} disabled={activating || !code.trim()} className="h-12 gradient-primary px-6">
            {activating ? '...' : 'Aktifkan'}
          </Button>
        </div>
      </div>
    </div>
  );
}
