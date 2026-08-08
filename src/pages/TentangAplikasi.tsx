import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { APP_NAME, APP_VERSION } from '@/constants/app';
import logo from '@/assets/logo.png';

export default function TentangAplikasi() {
  const navigate = useNavigate();
  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>
      <div className="text-center mb-6">
        <motion.div
          className="relative inline-flex items-center justify-center w-24 h-24 mb-2"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"
            animate={{ scale: [0.9, 1.12, 0.9], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.img
            src={logo}
            alt={APP_NAME}
            className="relative w-24 h-24 object-contain"
            animate={{ scale: [1, 1.05, 1], rotate: [-2, 2, -2] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
        <h1 className="text-xl font-bold text-foreground">{APP_NAME}</h1>
        <p className="text-sm text-muted-foreground">Versi V{APP_VERSION}</p>
      </div>
      <div className="bg-card rounded-2xl p-5 shadow-card space-y-3">
        <p className="text-sm text-foreground leading-relaxed">
          <strong>{APP_NAME}</strong> adalah aplikasi pencatatan transaksi digital untuk agen layanan keuangan. 
          Didesain untuk mempermudah pencatatan tarik tunai, setor tunai, dan transfer.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Fitur utama: Buka/Tutup Toko, Pencatatan Transaksi Otomatis, Buku Kas, Laporan Harian, 
          Struk Digital PDF, dan Backup Data.
        </p>
        <div className="border-t border-border pt-3 space-y-1">
          <p className="text-xs text-muted-foreground">Dikembangkan dengan ❤️ oleh <strong className="text-foreground">Andriawan Delv</strong></p>
          <p className="text-xs text-muted-foreground">© 2026 {APP_NAME}. Semua hak dilindungi.</p>
        </div>
      </div>
    </div>
  );
}
