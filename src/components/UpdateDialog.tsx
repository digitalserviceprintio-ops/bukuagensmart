import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Download, Sparkles } from 'lucide-react';
import { APP_VERSION } from '@/constants/app';
import { motion } from 'framer-motion';

interface UpdateDialogProps {
  open: boolean;
  latestVersion: string;
  onUpdate: () => void;
  onDismiss: () => void;
}

export default function UpdateDialog({ open, latestVersion, onUpdate, onDismiss }: UpdateDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-sm rounded-2xl glass-card border-0">
        <AlertDialogHeader className="items-center">
          <motion.div
            className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center mb-2"
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Sparkles className="h-10 w-10 text-primary" />
          </motion.div>
          <AlertDialogTitle className="text-center text-lg font-display">
            🎉 Pembaruan Tersedia!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-2">
            <span className="block">
              Versi baru <span className="font-bold text-foreground">v{latestVersion}</span> telah tersedia.
            </span>
            <span className="block text-xs text-muted-foreground">
              Versi Anda saat ini: <span className="font-mono">v{APP_VERSION}</span>
            </span>
            <span className="block text-xs">
              Perbarui sekarang untuk mendapatkan fitur terbaru dan perbaikan bug.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction onClick={onUpdate} className="w-full gradient-primary shadow-button">
            <Download className="h-4 w-4 mr-2" />
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