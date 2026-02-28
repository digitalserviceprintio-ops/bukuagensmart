import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const regionId = 'barcode-reader';
    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 150 } },
      (decodedText) => {
        scanner.stop().then(() => {
          onDetected(decodedText);
        }).catch(console.error);
      },
      () => {}
    ).catch((err) => {
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
      console.error(err);
    });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">Scan Barcode</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {error ? (
          <div className="text-center">
            <p className="text-destructive text-sm mb-4">{error}</p>
            <Button onClick={onClose}>Kembali</Button>
          </div>
        ) : (
          <>
            <div id="barcode-reader" ref={containerRef} className="w-full max-w-sm rounded-xl overflow-hidden" />
            <p className="text-muted-foreground text-xs mt-4 text-center">
              Arahkan kamera ke barcode produk (EAN-13 / Code 128)
            </p>
          </>
        )}
      </div>
    </div>
  );
}
