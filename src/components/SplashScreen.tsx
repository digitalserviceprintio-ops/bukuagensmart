import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { APP_NAME, APP_VERSION } from '@/constants/app';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFadeOut(true), 1800);
    const timer2 = setTimeout(() => onFinish(), 2300);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] gradient-hero flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="animate-fade-in flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl gradient-success flex items-center justify-center shadow-button mb-4 animate-bounce-slow">
          <Shield className="h-10 w-10 text-secondary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-primary-foreground mb-1">{APP_NAME}</h1>
        <p className="text-primary-foreground/60 text-sm">Manajemen Tarik Tunai & Setor Tunai</p>
        <div className="mt-8">
          <div className="w-8 h-8 border-3 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
        </div>
        <p className="text-primary-foreground/40 text-xs mt-6">v{APP_VERSION}</p>
      </div>
    </div>
  );
}
