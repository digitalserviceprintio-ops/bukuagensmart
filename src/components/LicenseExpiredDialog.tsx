import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Crown, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatRupiah } from '@/data/mockData';

interface LicenseExpiredDialogProps {
  open: boolean;
  daysLeft: number | null;
  isExpired: boolean;
}

export default function LicenseExpiredDialog({ open, daysLeft, isExpired }: LicenseExpiredDialogProps) {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader className="items-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            {isExpired ? <Crown className="h-8 w-8 text-destructive" /> : <Clock className="h-8 w-8 text-warning" />}
          </div>
          <AlertDialogTitle className="text-center">
            {isExpired ? 'Masa Trial Habis' : `Trial Tersisa ${daysLeft} Hari`}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {isExpired
              ? 'Masa uji coba 30 hari Anda telah berakhir. Silakan upgrade ke Premium untuk melanjutkan menggunakan aplikasi.'
              : 'Masa uji coba Anda akan segera berakhir. Upgrade sekarang untuk akses tanpa batas.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 my-2">
          <div className="bg-muted rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Premium Bulanan</span>
            <span className="text-sm font-bold text-primary">{formatRupiah(16999)}/bln</span>
          </div>
          <div className="bg-secondary/10 rounded-xl p-3 flex items-center justify-between border border-secondary/30">
            <span className="text-xs font-medium text-foreground">Premium Selamanya</span>
            <span className="text-sm font-bold text-secondary">{formatRupiah(55999)}</span>
          </div>
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction onClick={() => navigate('/profil/lisensi')} className="w-full gradient-primary">
            Aktivasi Sekarang
          </AlertDialogAction>
          {!isExpired && (
            <AlertDialogAction onClick={() => {}} className="w-full bg-muted text-foreground hover:bg-accent">
              Nanti Saja
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
