import { useState } from 'react';
import { Shield, Smartphone, User as UserIcon } from 'lucide-react';
import { APP_NAME, APP_VERSION } from '@/constants/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, loading, login, register } = useAuth();

  // Redirect if already authenticated
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone || pin.length < 6) {
      setError('Masukkan nomor HP dan PIN minimal 6 digit');
      return;
    }
    if (isRegister && !name) {
      setError('Masukkan nama lengkap');
      return;
    }
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(phone, pin, name);
      } else {
        await login(phone, pin);
      }
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'Nomor HP atau PIN salah' : err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-success mb-4 shadow-button">
            <Shield className="h-8 w-8 text-secondary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground">Buku Agen</h1>
          <p className="text-primary-foreground/70 text-sm mt-1">Tarik Tunai & Setor Tunai</p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nama Lengkap</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Nama lengkap" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} className="pl-10 h-12 text-base" />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nomor HP</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="tel" placeholder="08xxxxxxxxxx" value={phone} onChange={(e) => { setPhone(e.target.value); setError(''); }} className="pl-10 h-12 text-base" maxLength={15} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">PIN (min 6 digit)</label>
              <Input type="password" placeholder="••••••" value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }} className="h-12 text-center text-xl tracking-[0.5em]" maxLength={6} />
            </div>
            {error && <p className="text-destructive text-sm text-center">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full h-12 text-base font-semibold gradient-primary shadow-button disabled:opacity-50">
              {submitting ? 'Memproses...' : isRegister ? 'Daftar' : 'Masuk'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
            <button onClick={() => { setIsRegister(!isRegister); setError(''); }} className="text-secondary font-semibold">
              {isRegister ? 'Masuk' : 'Daftar'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
