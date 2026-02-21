import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Smartphone } from 'lucide-react';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || pin.length < 4) {
      setError('Masukkan nomor HP dan PIN yang valid');
      return;
    }
    localStorage.setItem('agent_logged_in', 'true');
    navigate('/');
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nomor HP</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(''); }}
                  className="pl-10 h-12 text-base"
                  maxLength={15}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">PIN</label>
              <Input
                type="password"
                placeholder="••••••"
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                className="h-12 text-center text-xl tracking-[0.5em]"
                maxLength={6}
              />
            </div>
            {error && <p className="text-destructive text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full h-12 text-base font-semibold gradient-primary shadow-button">
              Masuk
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Belum punya akun?{' '}
            <button className="text-secondary font-semibold">Daftar</button>
          </p>
        </div>
      </div>
    </div>
  );
}
