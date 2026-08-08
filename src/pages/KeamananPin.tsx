import { useState } from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CatEyeIcon } from '@/components/CatEyeIcon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';


export default function KeamananPin() {
  const navigate = useNavigate();
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 6) { toast({ title: 'PIN minimal 6 digit', variant: 'destructive' }); return; }
    if (newPin !== confirmPin) { toast({ title: 'PIN baru tidak cocok', variant: 'destructive' }); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPin });
      if (error) throw error;
      toast({ title: 'PIN berhasil diubah' });
      navigate(-1);
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>
      <h1 className="text-lg font-bold text-foreground mb-1">Keamanan & PIN</h1>
      <p className="text-sm text-muted-foreground mb-6">Ubah PIN transaksi Anda</p>

      <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 shadow-card space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">PIN Lama</label>
          <div className="relative">
            <Input type={showOld ? 'text' : 'password'} value={oldPin} onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))} placeholder="••••••" className="h-12 text-center text-xl tracking-[0.5em] pr-12" maxLength={6} />
            <button type="button" onClick={() => setShowOld((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showOld ? 'Sembunyikan PIN' : 'Tampilkan PIN'} tabIndex={-1}>
              <CatEyeIcon open={!showOld} className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">PIN Baru</label>
          <div className="relative">
            <Input type={showNew ? 'text' : 'password'} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} placeholder="••••••" className="h-12 text-center text-xl tracking-[0.5em] pr-12" maxLength={6} />
            <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showNew ? 'Sembunyikan PIN' : 'Tampilkan PIN'} tabIndex={-1}>
              <CatEyeIcon open={!showNew} className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Konfirmasi PIN Baru</label>
          <div className="relative">
            <Input type={showConfirm ? 'text' : 'password'} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} placeholder="••••••" className="h-12 text-center text-xl tracking-[0.5em] pr-12" maxLength={6} />
            <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showConfirm ? 'Sembunyikan PIN' : 'Tampilkan PIN'} tabIndex={-1}>
              <CatEyeIcon open={!showConfirm} className="h-5 w-5" />
            </button>
          </div>
        </div>

        <Button type="submit" disabled={submitting} className="w-full h-12 gradient-primary shadow-button">
          {submitting ? 'Memproses...' : 'Ubah PIN'}
        </Button>
      </form>
    </div>
  );
}
