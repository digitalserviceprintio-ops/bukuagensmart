import { User, Shield, LogOut, FileText, HelpCircle, ChevronRight, Store, Calculator, Trash2, Info, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const menuItems = [
  { icon: Store, label: 'Atur Profil Toko', desc: 'Info nama & alamat toko', path: '/profil/toko' },
  { icon: Shield, label: 'Keamanan & PIN', desc: 'Ubah PIN transaksi', path: '/profil/keamanan' },
  { icon: Calculator, label: 'Atur Biaya Admin', desc: 'Biaya per kelipatan nominal', path: '/profil/biaya-admin' },
  { icon: FileText, label: 'Riwayat Aktivitas', desc: 'Log aktivitas & struk', path: '/profil/riwayat' },
  { icon: HelpCircle, label: 'Bantuan', desc: 'Pusat bantuan & FAQ', path: '/profil/bantuan' },
  { icon: Info, label: 'Tentang Aplikasi', desc: 'Versi & informasi', path: '/profil/tentang' },
  { icon: Trash2, label: 'Reset Data', desc: 'Hapus data transaksi', path: '/profil/reset' },
];

export default function Profil() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<{ name: string; phone: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('name, phone').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { if (data) setProfile(data as any); });
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = profile?.name || user?.user_metadata?.name || 'Agen';
  const displayPhone = profile?.phone || user?.user_metadata?.phone || '';

  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      <div className="bg-card rounded-2xl p-5 shadow-card flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center">
          <User className="h-7 w-7 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">{displayName}</h2>
          <p className="text-sm text-muted-foreground">{displayPhone}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-semibold rounded-full">Agen Aktif</span>
        </div>
      </div>

      <div className="space-y-2">
        {menuItems.map((item) => (
          <button key={item.label} onClick={() => navigate(item.path)} className="w-full bg-card rounded-xl p-4 flex items-center gap-3 shadow-card text-left">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <item.icon className="h-5 w-5 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          document.documentElement.classList.toggle('dark');
          localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        }}
        className="w-full mt-4 bg-card rounded-xl p-4 flex items-center gap-3 shadow-card"
      >
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <Moon className="h-5 w-5 text-foreground dark:hidden" />
          <Sun className="h-5 w-5 text-foreground hidden dark:block" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Mode Gelap</p>
          <p className="text-[10px] text-muted-foreground">Aktifkan/nonaktifkan tema gelap</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      <button onClick={handleLogout} className="w-full mt-4 bg-destructive/10 rounded-xl p-4 flex items-center justify-center gap-2 active:scale-95 transition-transform">
        <LogOut className="h-5 w-5 text-destructive" />
        <span className="text-sm font-semibold text-destructive">Keluar</span>
      </button>
    </div>
  );
}
