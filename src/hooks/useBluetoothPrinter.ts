import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

// ESC/POS command helpers
function textEncoder(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

function escposInit(): number[] {
  return [ESC, 0x40]; // Initialize printer
}

function escposCenter(): number[] {
  return [ESC, 0x61, 0x01]; // Center align
}

function escposLeft(): number[] {
  return [ESC, 0x61, 0x00]; // Left align
}

function escposRight(): number[] {
  return [ESC, 0x61, 0x02]; // Right align
}

function escposBoldOn(): number[] {
  return [ESC, 0x45, 0x01];
}

function escposBoldOff(): number[] {
  return [ESC, 0x45, 0x00];
}

function escposFontSmall(): number[] {
  return [ESC, 0x21, 0x01]; // Small font
}

function escposFontNormal(): number[] {
  return [ESC, 0x21, 0x00]; // Normal font
}

function escposFontLarge(): number[] {
  return [ESC, 0x21, 0x30]; // Double height+width
}

function escposCut(): number[] {
  return [GS, 0x56, 0x00]; // Full cut
}

function escposFeedLines(n: number): number[] {
  return [ESC, 0x64, n]; // Feed n lines
}

function escposSeparator(charCount = 32): number[] {
  const line = '-'.repeat(charCount);
  return [...textEncoder(line), LF];
}

function buildLine(left: string, right: string, width = 32): string {
  const space = width - left.length - right.length;
  if (space <= 0) return left + right;
  return left + ' '.repeat(space) + right;
}

export interface ReceiptData {
  txId: string;
  items: { name: string; qty: number; price: number; subtotal: number }[];
  discount: number;
  grandTotal: number;
  paymentMethod: string;
  cashPaid?: number;
  toko?: { nama: string; alamat: string; noHp: string };
}

function buildReceiptBytes(data: ReceiptData): Uint8Array {
  const cmds: number[] = [];
  const WIDTH = 32; // 58mm printer = ~32 chars

  // Init
  cmds.push(...escposInit());

  // Header - store name
  cmds.push(...escposCenter());
  cmds.push(...escposBoldOn());
  cmds.push(...escposFontLarge());
  cmds.push(...textEncoder(data.toko?.nama || 'STRUK PENJUALAN'));
  cmds.push(LF);
  cmds.push(...escposFontNormal());
  cmds.push(...escposBoldOff());

  if (data.toko?.alamat) {
    cmds.push(...escposFontSmall());
    cmds.push(...textEncoder(data.toko.alamat));
    cmds.push(LF);
  }
  if (data.toko?.noHp) {
    cmds.push(...textEncoder(`HP: ${data.toko.noHp}`));
    cmds.push(LF);
  }
  cmds.push(...escposFontNormal());
  cmds.push(LF);

  // Transaction info
  cmds.push(...textEncoder(`No: ${data.txId.slice(0, 8)}`));
  cmds.push(LF);
  cmds.push(...textEncoder(new Date().toLocaleString('id-ID')));
  cmds.push(LF);

  // Separator
  cmds.push(...escposLeft());
  cmds.push(...escposSeparator(WIDTH));

  // Items
  cmds.push(...escposFontSmall());
  for (const item of data.items) {
    cmds.push(...textEncoder(item.name));
    cmds.push(LF);
    const detail = `  ${item.qty}x ${formatNum(item.price)}`;
    const sub = formatNum(item.subtotal);
    cmds.push(...textEncoder(buildLine(detail, sub, WIDTH)));
    cmds.push(LF);
  }
  cmds.push(...escposFontNormal());

  // Separator
  cmds.push(...escposSeparator(WIDTH));

  // Subtotal
  const subtotal = data.items.reduce((s, i) => s + i.subtotal, 0);
  cmds.push(...textEncoder(buildLine('Subtotal', formatNum(subtotal), WIDTH)));
  cmds.push(LF);

  // Discount
  if (data.discount > 0) {
    cmds.push(...textEncoder(buildLine('Diskon', `-${formatNum(data.discount)}`, WIDTH)));
    cmds.push(LF);
  }

  // Grand total
  cmds.push(...escposBoldOn());
  cmds.push(...textEncoder(buildLine('TOTAL', formatNum(data.grandTotal), WIDTH)));
  cmds.push(LF);
  cmds.push(...escposBoldOff());

  // Payment info
  cmds.push(...textEncoder(buildLine('Bayar', data.paymentMethod.toUpperCase(), WIDTH)));
  cmds.push(LF);

  if (data.paymentMethod === 'cash' && data.cashPaid && data.cashPaid > 0) {
    cmds.push(...textEncoder(buildLine('Tunai', formatNum(data.cashPaid), WIDTH)));
    cmds.push(LF);
    const change = data.cashPaid - data.grandTotal;
    if (change >= 0) {
      cmds.push(...textEncoder(buildLine('Kembali', formatNum(change), WIDTH)));
      cmds.push(LF);
    }
  }

  // Separator
  cmds.push(...escposSeparator(WIDTH));

  // Footer
  cmds.push(...escposCenter());
  cmds.push(LF);
  cmds.push(...textEncoder('Terima kasih!'));
  cmds.push(LF);
  cmds.push(...textEncoder('Barang yg sudah dibeli'));
  cmds.push(LF);
  cmds.push(...textEncoder('tidak dapat ditukar/dikembalikan'));
  cmds.push(LF);

  // Feed & cut
  cmds.push(...escposFeedLines(4));
  cmds.push(...escposCut());

  return new Uint8Array(cmds);
}

function formatNum(n: number): string {
  return 'Rp' + n.toLocaleString('id-ID');
}

// Common Bluetooth printer service/characteristic UUIDs
const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
];

const PRINTER_CHAR_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
];

export function useBluetoothPrinter() {
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const deviceRef = useRef<any>(null);
  const characteristicRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' && !!(navigator as any).bluetooth;

  const connect = useCallback(async () => {
    if (!isSupported) {
      toast.error('Bluetooth tidak didukung. Gunakan Chrome di Android.');
      return false;
    }

    setConnecting(true);
    try {
      const bt = (navigator as any).bluetooth;
      const device = await bt.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICE_UUIDS,
      });

      deviceRef.current = device;
      device.addEventListener('gattserverdisconnected', () => {
        setDeviceName(null);
        characteristicRef.current = null;
        toast.info('Printer terputus');
      });

      const server = await device.gatt.connect();

      // Try to find the writable characteristic
      let writeChar: any = null;
      for (const svcUuid of PRINTER_SERVICE_UUIDS) {
        try {
          const service = await server.getPrimaryService(svcUuid);
          for (const charUuid of PRINTER_CHAR_UUIDS) {
            try {
              const char = await service.getCharacteristic(charUuid);
              if (char.properties.write || char.properties.writeWithoutResponse) {
                writeChar = char;
                break;
              }
            } catch { /* try next */ }
          }
          if (writeChar) break;
          // Fallback: iterate all characteristics
          if (!writeChar) {
            try {
              const chars = await service.getCharacteristics();
              for (const c of chars) {
                if (c.properties.write || c.properties.writeWithoutResponse) {
                  writeChar = c;
                  break;
                }
              }
            } catch { /* skip */ }
          }
          if (writeChar) break;
        } catch { /* try next service */ }
      }

      if (!writeChar) {
        // Last resort: try all services
        try {
          const services = await server.getPrimaryServices();
          for (const svc of services) {
            const chars = await svc.getCharacteristics();
            for (const c of chars) {
              if (c.properties.write || c.properties.writeWithoutResponse) {
                writeChar = c;
                break;
              }
            }
            if (writeChar) break;
          }
        } catch { /* give up */ }
      }

      if (!writeChar) {
        toast.error('Tidak dapat menemukan karakteristik printer. Pastikan printer kompatibel.');
        await device.gatt.disconnect();
        setConnecting(false);
        return false;
      }

      characteristicRef.current = writeChar;
      setDeviceName(device.name || 'Printer BT');
      toast.success(`Terhubung ke ${device.name || 'Printer'}`);
      setConnecting(false);
      return true;
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        toast.error('Gagal: ' + (err.message || 'Unknown'));
      }
      setConnecting(false);
      return false;
    }
  }, [isSupported]);

  const disconnect = useCallback(() => {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    setDeviceName(null);
    characteristicRef.current = null;
    toast.success('Printer terputus');
  }, []);

  const printReceipt = useCallback(async (data: ReceiptData): Promise<boolean> => {
    if (!characteristicRef.current) {
      toast.error('Printer belum terhubung');
      return false;
    }

    setPrinting(true);
    try {
      const bytes = buildReceiptBytes(data);
      const char = characteristicRef.current;

      // Send in chunks (BLE has ~20 byte MTU, but most printers handle ~512)
      const CHUNK_SIZE = 512;
      for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        const chunk = bytes.slice(i, i + CHUNK_SIZE);
        if (char.properties.writeWithoutResponse) {
          await char.writeValueWithoutResponse(chunk);
        } else {
          await char.writeValue(chunk);
        }
        // Small delay between chunks
        await new Promise(r => setTimeout(r, 50));
      }

      toast.success('Struk berhasil dicetak!');
      setPrinting(false);
      return true;
    } catch (err: any) {
      toast.error('Gagal mencetak: ' + (err.message || 'Unknown'));
      setPrinting(false);
      return false;
    }
  }, []);

  return {
    deviceName,
    connecting,
    printing,
    isSupported,
    isConnected: !!deviceName,
    connect,
    disconnect,
    printReceipt,
  };
}
