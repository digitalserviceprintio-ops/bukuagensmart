import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Smartphone, User as UserIcon } from 'lucide-react';
import { CatEyeIcon } from '@/components/CatEyeIcon';
import logo from '@/assets/logo.png';
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
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="relative inline-flex items-center justify-center w-28 h-28 mb-3"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-white/20 blur-2xl"
              animate={{ scale: [0.9, 1.12, 0.9], opacity: [0.35, 0.7, 0.35] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.img
              src={logo}
              alt={APP_NAME}
              className="relative w-28 h-28 object-contain drop-shadow-2xl"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: [1, 1.05, 1], rotate: [-2, 2, -2], opacity: 1 }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
          <h1 className="text-2xl font-bold text-primary-foreground font-display">{APP_NAME}</h1>
          <p className="text-primary-foreground/70 text-sm mt-1">Manajemen Tarik Tunai & Setor Tunai</p>
        </div>

        <motion.div
          className="glass-card rounded-2xl p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nama Lengkap</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Nama lengkap" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} className="pl-10 h-12 text-base" />
                </div>
              </motion.div>
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
            {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-sm text-center">{error}</motion.p>}
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
        </motion.div>
        <p className="text-center text-xs text-primary-foreground/50 mt-4">v{APP_VERSION}</p>
      </motion.div>
    </div>
  );
}
