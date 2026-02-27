import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TentangAplikasi() {
  const navigate = useNavigate();
  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-success mb-3 shadow-button">
          <Shield className="h-8 w-8 text-secondary-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Buku Agen</h1>
        <p className="text-sm text-muted-foreground">Versi 1.0.0</p>
      </div>
      <div className="bg-card rounded-2xl p-5 shadow-card space-y-3">
        <p className="text-sm text-foreground leading-relaxed">
          <strong>Buku Agen</strong> adalah aplikasi pencatatan transaksi digital untuk agen layanan keuangan. 
          Didesain untuk mempermudah pencatatan tarik tunai, setor tunai, dan transfer.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Fitur utama: Buka/Tutup Toko, Pencatatan Transaksi Otomatis, Buku Kas, Laporan Harian, 
          Struk Digital PDF, dan Backup Data.
        </p>
        <div className="border-t border-border pt-3 space-y-1">
          <p className="text-xs text-muted-foreground">Dikembangkan dengan ❤️ oleh <strong className="text-foreground">Andriawan Delv</strong></p>
          <p className="text-xs text-muted-foreground">© 2026 Buku Agen. Semua hak dilindungi.</p>
        </div>
      </div>
    </div>
  );
}
