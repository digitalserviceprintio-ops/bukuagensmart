import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { Construction } from 'lucide-react';
import { APP_NAME } from '@/constants/app';

interface MaintenanceDialogProps {
  open: boolean;
  message: string;
}

export default function MaintenanceDialog({ open, message }: MaintenanceDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-sm rounded-2xl">
        <AlertDialogHeader className="items-center">
          <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-2">
            <Construction className="h-8 w-8 text-warning" />
          </div>
          <AlertDialogTitle className="text-center">
            Maintenance
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="text-center text-xs text-muted-foreground mt-2">
          {APP_NAME} akan segera kembali
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
