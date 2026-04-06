import { motion } from 'framer-motion';
import { Home, ArrowLeftRight, BookOpen, BarChart3, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { icon: Home, label: 'Beranda', path: '/' },
  { icon: ArrowLeftRight, label: 'Transaksi', path: '/transaksi' },
  { icon: BookOpen, label: 'Buku Kas', path: '/buku-kas' },
  { icon: BarChart3, label: 'Laporan', path: '/laporan' },
  { icon: User, label: 'Profil', path: '/profil' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t-0 rounded-t-2xl">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 relative transition-colors"
            >
              {isActive && (
                <motion.div
                  className="absolute -top-0.5 w-8 h-1 rounded-full bg-primary"
                  layoutId="nav-indicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-primary stroke-[2.5]' : 'text-muted-foreground'}`} />
              </motion.div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
