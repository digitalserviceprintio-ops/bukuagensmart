import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Minus, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { formatRupiah } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface StockEntry {
  id: string;
  product_name: string;
  type: string;
  qty: number;
  note: string;
  created_at: string;
}

export default function ManajemenStok() {
  const navigate = useNavigate();
  const { products, refresh } = useProducts();
  const [history, setHistory] = useState<StockEntry[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [type, setType] = useState<'in' | 'out'>('in');
  const [qty, setQty] = useState(0);
  const [note, setNote] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('stock_history' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setHistory((data || []) as any as StockEntry[]);
    };
    fetchHistory();
  }, []);

  const handleSubmit = async () => {
    if (!selectedProduct || qty <= 0) { toast.error('Lengkapi data'); return; }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (type === 'out' && qty > product.stock) {
      toast.error('Stok tidak cukup');
      return;
    }

    const newStock = type === 'in' ? product.stock + qty : product.stock - qty;

    await supabase.from('products' as any).update({ stock: newStock } as any).eq('id', product.id);
    await supabase.from('stock_history' as any).insert({
      user_id: user.id,
      product_id: product.id,
      product_name: product.name,
      type,
      qty,
      note,
    } as any);

    toast.success(`Stok ${type === 'in' ? 'masuk' : 'keluar'} berhasil`);
    setDialogOpen(false);
    setQty(0);
    setNote('');
    refresh();

    // Refresh history
    const { data } = await supabase
      .from('stock_history' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setHistory((data || []) as any as StockEntry[]);
  };

  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/toko')} className="p-2 rounded-xl bg-muted">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Manajemen Stok</h1>
      </div>

      {/* Low Stock Alert */}
      {products.filter(p => p.stock <= p.min_stock).length > 0 && (
        <div className="bg-warning/10 rounded-xl p-3 mb-4">
          <p className="text-xs font-semibold text-foreground mb-1">⚠️ Stok Menipis</p>
          {products.filter(p => p.stock <= p.min_stock).map(p => (
            <p key={p.id} className="text-[10px] text-muted-foreground">{p.name}: {p.stock} tersisa (min: {p.min_stock})</p>
          ))}
        </div>
      )}

      <Button onClick={() => setDialogOpen(true)} className="w-full mb-4 gap-2">
        <Package className="h-4 w-4" /> Stok Masuk / Keluar
      </Button>

      {/* History */}
      <h2 className="text-sm font-semibold text-foreground mb-2">Riwayat Stok</h2>
      {history.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-4">Belum ada riwayat</p>
      ) : (
        <div className="space-y-2">
          {history.map(h => (
            <div key={h.id} className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${h.type === 'in' ? 'bg-secondary/10' : 'bg-destructive/10'}`}>
                {h.type === 'in' ? <Plus className="h-4 w-4 text-secondary" /> : <Minus className="h-4 w-4 text-destructive" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{h.product_name}</p>
                <p className="text-[10px] text-muted-foreground">{h.note || (h.type === 'in' ? 'Stok Masuk' : 'Stok Keluar')}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${h.type === 'in' ? 'text-secondary' : 'text-destructive'}`}>
                  {h.type === 'in' ? '+' : '-'}{h.qty}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(h.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Stock Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stok Masuk / Keluar</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">Produk</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger><SelectValue placeholder="Pilih produk" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Tipe</label>
              <Select value={type} onValueChange={v => setType(v as 'in' | 'out')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stok Masuk</SelectItem>
                  <SelectItem value="out">Stok Keluar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Jumlah</label>
              <Input type="number" value={qty || ''} onChange={e => setQty(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-medium">Catatan</label>
              <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Opsional" />
            </div>
            <Button onClick={handleSubmit} className="w-full">Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
