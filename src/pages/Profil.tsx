import { useNavigate } from 'react-router-dom';
import { User, Shield, LogOut, FileText, HelpCircle, ChevronRight } from 'lucide-react';

const menuItems = [
  { icon: Shield, label: 'Keamanan & PIN', desc: 'Ubah PIN transaksi' },
  { icon: FileText, label: 'Riwayat Aktivitas', desc: 'Log aktivitas akun' },
  { icon: HelpCircle, label: 'Bantuan', desc: 'Pusat bantuan' },
];

export default function Profil() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('agent_logged_in');
    navigate('/login');
  };

  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      {/* Profile Header */}
      <div className="bg-card rounded-2xl p-5 shadow-card flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center">
          <User className="h-7 w-7 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Budi Santoso</h2>
          <p className="text-sm text-muted-foreground">0812-3456-7890</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-semibold rounded-full">Agen Aktif</span>
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-2">
        {menuItems.map((item) => (
          <button key={item.label} className="w-full bg-card rounded-xl p-4 flex items-center gap-3 shadow-card text-left">
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

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full mt-6 bg-destructive/10 rounded-xl p-4 flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        <LogOut className="h-5 w-5 text-destructive" />
        <span className="text-sm font-semibold text-destructive">Keluar</span>
      </button>
    </div>
  );
}
