import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Download } from 'lucide-react';
import { APP_VERSION } from '@/constants/app';

interface UpdateDialogProps {
  open: boolean;
  latestVersion: string;
  onUpdate: () => void;
  onDismiss: () => void;
}

export default function UpdateDialog({ open, latestVersion, onUpdate, onDismiss }: UpdateDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader className="items-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Download className="h-8 w-8 text-primary" />
          </div>
          <AlertDialogTitle className="text-center">
            Update Tersedia
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Versi terbaru <span className="font-semibold">v{latestVersion}</span> telah tersedia. Anda saat ini menggunakan <span className="font-semibold">v{APP_VERSION}</span>. Update untuk pengalaman terbaik.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction onClick={onUpdate} className="w-full gradient-primary">
            Update Sekarang
          </AlertDialogAction>
          <AlertDialogAction onClick={onDismiss} className="w-full bg-muted text-foreground hover:bg-accent">
            Nanti Saja
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
