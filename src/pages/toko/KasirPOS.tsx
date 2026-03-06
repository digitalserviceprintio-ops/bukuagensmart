import { useState, useCallback } from 'react';
import { ArrowLeft, ScanLine, Plus, Minus, Trash2, ShoppingCart, Search, Printer, Bluetooth } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProducts, Product } from '@/hooks/useProducts';
import { useTokoProfile } from '@/hooks/useTokoProfile';
import { useBluetoothPrinter, ReceiptData } from '@/hooks/useBluetoothPrinter';
import { supabase } from '@/integrations/supabase/client';
import { formatRupiah } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BarcodeScanner from '@/components/BarcodeScanner';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface CartItem {
  product: Product;
  qty: number;
  subtotal: number;
}

export default function KasirPOS() {
  const navigate = useNavigate();
  const { products, findByBarcode, refresh } = useProducts();
  const { profile: tokoProfile } = useTokoProfile();
  const printer = useBluetoothPrinter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [printerOpen, setPrinterOpen] = useState(false);
  const [cashPaid, setCashPaid] = useState(0);

  const total = cart.reduce((s, i) => s + i.subtotal, 0);
  const grandTotal = Math.max(0, total - discount);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.error('Stok tidak cukup');
          return prev;
        }
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * product.sell_price }
            : i
        );
      }
      if (product.stock <= 0) {
        toast.error('Stok habis');
        return prev;
      }
      return [...prev, { product, qty: 1, subtotal: product.sell_price }];
    });
  }, []);

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product.id !== productId) return i;
      const newQty = i.qty + delta;
      if (newQty <= 0) return i;
      if (newQty > i.product.stock) { toast.error('Stok tidak cukup'); return i; }
      return { ...i, qty: newQty, subtotal: newQty * i.product.sell_price };
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const handleBarcodeScan = async (code: string) => {
    setScanning(false);
    const product = await findByBarcode(code);
    if (product) {
      addToCart(product);
      toast.success(`${product.name} ditambahkan`);
    } else {
      toast.error('Produk tidak ditemukan');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: txData, error: txError } = await supabase
      .from('pos_transactions' as any)
      .insert({
        user_id: user.id, total, discount,
        grand_total: grandTotal, payment_method: paymentMethod,
      } as any)
      .select().single();

    if (txError || !txData) { toast.error('Gagal menyimpan transaksi'); console.error(txError); return; }

    const txId = (txData as any).id;

    const items = cart.map(i => ({
      pos_transaction_id: txId, product_id: i.product.id,
      product_name: i.product.name, qty: i.qty,
      price: i.product.sell_price, subtotal: i.subtotal,
    }));

    await supabase.from('pos_transaction_items' as any).insert(items as any);

    for (const item of cart) {
      const newStock = item.product.stock - item.qty;
      await supabase.from('products' as any).update({ stock: newStock } as any).eq('id', item.product.id);
      await supabase.from('stock_history' as any).insert({
        user_id: user.id, product_id: item.product.id,
        product_name: item.product.name, type: 'out', qty: item.qty,
        note: `Penjualan POS #${txId.slice(0, 8)}`,
      } as any);
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: tokoData } = await supabase
      .from('buka_toko').select('*')
      .eq('user_id', user.id).eq('tanggal', today).eq('status', 'OPEN')
      .maybeSingle();

    if (tokoData) {
      const kasChange = paymentMethod === 'cash' ? grandTotal : 0;
      const rekChange = paymentMethod !== 'cash' ? grandTotal : 0;
      await supabase.from('buka_toko').update({
        selisih_kas: (Number(tokoData.selisih_kas) || 0) + kasChange,
        saldo_rekening_akhir: (Number(tokoData.saldo_rekening_akhir) || Number(tokoData.saldo_rekening_awal)) + rekChange,
      }).eq('id', tokoData.id);
    }

    await supabase.from('cash_book').insert({
      user_id: user.id, type: 'income', amount: grandTotal,
      description: `Penjualan POS #${txId.slice(0, 8)} (${paymentMethod})`,
      category: 'Penjualan Toko',
    });

    // Build receipt data
    const receiptData: ReceiptData = {
      txId,
      items: cart.map(i => ({ name: i.product.name, qty: i.qty, price: i.product.sell_price, subtotal: i.subtotal })),
      discount, grandTotal, paymentMethod,
      cashPaid: paymentMethod === 'cash' ? cashPaid : undefined,
      toko: tokoProfile.nama ? tokoProfile : undefined,
    };

    // Print via Bluetooth if connected, otherwise download PDF
    if (printer.isConnected) {
      await printer.printReceipt(receiptData);
    } else {
      generatePdfReceipt(receiptData);
    }

    toast.success('Transaksi berhasil!');
    setCart([]);
    setDiscount(0);
    setCashPaid(0);
    setCheckoutOpen(false);
    refresh();
  };

  const generatePdfReceipt = (data: ReceiptData) => {
    const doc = new jsPDF({ unit: 'mm', format: [80, 200] });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(data.toko?.nama || 'STRUK PENJUALAN', 40, 8, { align: 'center' });
    let y = 13;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    if (data.toko?.alamat) { doc.text(data.toko.alamat, 40, y, { align: 'center' }); y += 4; }
    if (data.toko?.noHp) { doc.text(`HP: ${data.toko.noHp}`, 40, y, { align: 'center' }); y += 4; }
    doc.text(`No: ${data.txId.slice(0, 8)}`, 40, y, { align: 'center' }); y += 4;
    doc.text(new Date().toLocaleString('id-ID'), 40, y, { align: 'center' }); y += 3;
    doc.line(4, y, 76, y); y += 4;

    data.items.forEach(i => {
      doc.text(i.name, 4, y);
      doc.text(`${i.qty}x ${formatRupiah(i.price)}`, 76, y, { align: 'right' }); y += 4;
      doc.text(formatRupiah(i.subtotal), 76, y, { align: 'right' }); y += 5;
    });

    doc.line(4, y, 76, y); y += 4;
    const subtotal = data.items.reduce((s, i) => s + i.subtotal, 0);
    doc.text('Subtotal:', 4, y);
    doc.text(formatRupiah(subtotal), 76, y, { align: 'right' });
    if (data.discount > 0) {
      y += 4; doc.text('Diskon:', 4, y);
      doc.text(`-${formatRupiah(data.discount)}`, 76, y, { align: 'right' });
    }
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 4, y);
    doc.text(formatRupiah(data.grandTotal), 76, y, { align: 'right' }); y += 4;
    doc.setFont('helvetica', 'normal');
    doc.text(`Bayar: ${data.paymentMethod.toUpperCase()}`, 4, y);
    if (data.paymentMethod === 'cash' && data.cashPaid && data.cashPaid > 0) {
      y += 4; doc.text(`Tunai: ${formatRupiah(data.cashPaid)}`, 4, y);
      y += 4; doc.text(`Kembali: ${formatRupiah(data.cashPaid - data.grandTotal)}`, 4, y);
    }
    y += 6;
    doc.text('Terima kasih!', 40, y, { align: 'center' });
    doc.save(`struk-pos-${data.txId.slice(0, 8)}.pdf`);
  };

  const searchResults = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search)
  ).slice(0, 10);

  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/toko')} className="p-2 rounded-xl bg-muted">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Kasir POS</h1>
        </div>
        <button onClick={() => setPrinterOpen(true)} className="p-2 rounded-xl bg-muted relative">
          <Printer className="h-5 w-5 text-foreground" />
          {printer.isConnected && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-background" />}
        </button>
      </div>

      {/* Scan & Search */}
      <div className="flex gap-2 mb-4">
        <Button onClick={() => setScanning(true)} className="flex-1 gap-2 gradient-primary text-primary-foreground">
          <ScanLine className="h-4 w-4" /> Scan Barcode
        </Button>
        <Button variant="outline" onClick={() => setSearchOpen(true)} className="flex-1 gap-2">
          <Search className="h-4 w-4" /> Cari Produk
        </Button>
      </div>

      {/* Cart */}
      {cart.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Keranjang kosong</p>
          <p className="text-xs text-muted-foreground">Scan barcode atau cari produk</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {cart.map(item => (
            <div key={item.product.id} className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                <p className="text-[10px] text-muted-foreground">@ {formatRupiah(item.product.sell_price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product.id, -1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product.id, 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm font-bold text-foreground w-20 text-right">{formatRupiah(item.subtotal)}</p>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.product.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Checkout Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-4">
          <div className="max-w-lg mx-auto bg-card rounded-xl shadow-lg border border-border p-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total ({cart.reduce((s, i) => s + i.qty, 0)} item)</span>
              <span className="text-base font-bold text-foreground">{formatRupiah(total)}</span>
            </div>
            <Button onClick={() => setCheckoutOpen(true)} className="w-full gap-2 gradient-success text-secondary-foreground">
              <ShoppingCart className="h-4 w-4" /> Bayar {formatRupiah(grandTotal)}
            </Button>
          </div>
        </div>
      )}

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Subtotal</span>
              <span className="text-sm font-bold">{formatRupiah(total)}</span>
            </div>
            <div>
              <label className="text-xs font-medium">Diskon (Rp)</label>
              <Input type="number" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} />
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-bold">Grand Total</span>
              <span className="text-lg font-bold text-secondary">{formatRupiah(grandTotal)}</span>
            </div>
            <div>
              <label className="text-xs font-medium">Metode Pembayaran</label>
              <Select value={paymentMethod} onValueChange={(v) => { setPaymentMethod(v); setCashPaid(0); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentMethod === 'cash' && (
              <div>
                <label className="text-xs font-medium">Uang Dibayar (Rp)</label>
                <Input type="number" value={cashPaid || ''} onChange={e => setCashPaid(Number(e.target.value))} placeholder="Masukkan nominal uang" />
                {cashPaid > 0 && (
                  <div className="flex justify-between mt-2 p-2 rounded-lg bg-muted">
                    <span className="text-xs font-medium">Kembalian</span>
                    <span className={`text-sm font-bold ${cashPaid >= grandTotal ? 'text-secondary' : 'text-destructive'}`}>
                      {cashPaid >= grandTotal ? formatRupiah(cashPaid - grandTotal) : 'Kurang ' + formatRupiah(grandTotal - cashPaid)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Print method indicator */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
              {printer.isConnected ? (
                <>
                  <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                  <Printer className="h-3.5 w-3.5 text-secondary" />
                  <span className="text-[10px] text-secondary font-medium">Cetak ke {printer.deviceName}</span>
                </>
              ) : (
                <>
                  <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Download PDF (printer tidak terhubung)</span>
                </>
              )}
            </div>

            <Button
              onClick={handleCheckout}
              disabled={(paymentMethod === 'cash' && cashPaid > 0 && cashPaid < grandTotal) || printer.printing}
              className="w-full gradient-success text-secondary-foreground gap-2"
            >
              {printer.printing ? (
                <>Mencetak...</>
              ) : printer.isConnected ? (
                <><Printer className="h-4 w-4" /> Proses & Cetak Struk</>
              ) : (
                <><ShoppingCart className="h-4 w-4" /> Proses & Download Struk</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cari Produk</DialogTitle>
          </DialogHeader>
          <Input placeholder="Nama atau barcode..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {searchResults.map(p => (
              <button key={p.id} onClick={() => { addToCart(p); setSearchOpen(false); setSearch(''); toast.success(`${p.name} ditambahkan`); }}
                className="w-full text-left p-2 rounded-lg hover:bg-muted flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">Stok: {p.stock}</p>
                </div>
                <p className="text-sm font-bold text-secondary">{formatRupiah(p.sell_price)}</p>
              </button>
            ))}
            {searchResults.length === 0 && search && (
              <p className="text-center text-sm text-muted-foreground py-4">Tidak ditemukan</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Printer Settings Dialog */}
      <Dialog open={printerOpen} onOpenChange={setPrinterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" /> Atur Printer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Bluetooth className="h-5 w-5 text-info" />
                <div>
                  <p className="text-sm font-medium text-foreground">Koneksi Bluetooth</p>
                  <p className="text-[10px] text-muted-foreground">Hubungkan printer thermal via Bluetooth</p>
                </div>
              </div>
              {printer.isConnected ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-secondary/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                      <span className="text-xs font-medium text-foreground">{printer.deviceName}</span>
                    </div>
                    <span className="text-[10px] text-secondary font-bold">Terhubung</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      disabled={printer.printing}
                      onClick={async () => {
                        await printer.printReceipt({
                          txId: 'TEST0000',
                          items: [{ name: 'Test Print', qty: 1, price: 1000, subtotal: 1000 }],
                          discount: 0, grandTotal: 1000, paymentMethod: 'cash',
                          toko: tokoProfile.nama ? tokoProfile : undefined,
                        });
                      }}
                    >
                      <Printer className="h-3 w-3" />
                      {printer.printing ? 'Mencetak...' : 'Test Print'}
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={printer.disconnect}>
                      Putuskan
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  disabled={printer.connecting}
                  onClick={printer.connect}
                >
                  <Bluetooth className="h-4 w-4" />
                  {printer.connecting ? 'Mencari...' : 'Cari Printer Bluetooth'}
                </Button>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground space-y-1">
              <p>• Pastikan printer thermal Bluetooth sudah dinyalakan</p>
              <p>• Gunakan browser Chrome di perangkat Android</p>
              <p>• Printer yang didukung: ESC/POS 58mm / 80mm</p>
              <p>• Jika printer tidak terhubung, struk akan diunduh sebagai PDF</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner */}
      {scanning && <BarcodeScanner onDetected={handleBarcodeScan} onClose={() => setScanning(false)} />}
    </div>
  );
}
