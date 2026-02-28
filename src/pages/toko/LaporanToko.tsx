import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProducts';
import { formatRupiah } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import jsPDF from 'jspdf';

interface SaleRow {
  id: string;
  total: number;
  discount: number;
  grand_total: number;
  payment_method: string;
  created_at: string;
}

interface SaleItem {
  product_name: string;
  qty: number;
  price: number;
  subtotal: number;
}

export default function LaporanToko() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const [period, setPeriod] = useState<'daily' | 'monthly'>('daily');
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);

  useEffect(() => {
    const fetchSales = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      let startDate: string;
      if (period === 'daily') {
        startDate = now.toISOString().slice(0, 10) + 'T00:00:00';
      } else {
        startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01T00:00:00`;
      }

      const { data: txs } = await supabase
        .from('pos_transactions' as any)
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      const salesData = (txs || []) as any as SaleRow[];
      setSales(salesData);

      // Get items for profit calculation
      if (salesData.length > 0) {
        const txIds = salesData.map(s => s.id);
        const { data: itemData } = await supabase
          .from('pos_transaction_items' as any)
          .select('*')
          .in('pos_transaction_id', txIds);
        setItems((itemData || []) as any as SaleItem[]);
      } else {
        setItems([]);
      }
    };
    fetchSales();
  }, [period]);

  const totalSales = sales.reduce((s, t) => s + Number(t.grand_total), 0);
  const totalDiscount = sales.reduce((s, t) => s + Number(t.discount), 0);

  // Calculate profit: sum of (sell_price - buy_price) * qty
  const totalProfit = items.reduce((sum, item) => {
    const product = products.find(p => p.name === item.product_name);
    const buyPrice = product ? product.buy_price : 0;
    return sum + (Number(item.price) - buyPrice) * item.qty;
  }, 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Laporan Penjualan ${period === 'daily' ? 'Harian' : 'Bulanan'}`, 14, 20);
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }), 14, 28);

    let y = 40;
    doc.setFontSize(11);
    doc.text(`Total Penjualan: ${formatRupiah(totalSales)}`, 14, y); y += 8;
    doc.text(`Total Diskon: ${formatRupiah(totalDiscount)}`, 14, y); y += 8;
    doc.text(`Total Keuntungan: ${formatRupiah(totalProfit)}`, 14, y); y += 8;
    doc.text(`Jumlah Transaksi: ${sales.length}`, 14, y); y += 12;

    doc.setFontSize(10);
    doc.text('No', 14, y);
    doc.text('Tanggal', 30, y);
    doc.text('Total', 90, y);
    doc.text('Metode', 140, y);
    y += 6;

    sales.forEach((s, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${i + 1}`, 14, y);
      doc.text(new Date(s.created_at).toLocaleString('id-ID'), 30, y);
      doc.text(formatRupiah(Number(s.grand_total)), 90, y);
      doc.text(s.payment_method.toUpperCase(), 140, y);
      y += 6;
    });

    doc.save(`laporan-toko-${period}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/toko')} className="p-2 rounded-xl bg-muted">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Laporan Toko</h1>
      </div>

      <Tabs value={period} onValueChange={v => setPeriod(v as any)} className="mb-4">
        <TabsList className="w-full">
          <TabsTrigger value="daily" className="flex-1">Harian</TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1">Bulanan</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card rounded-xl p-3 shadow-card">
          <p className="text-[10px] text-muted-foreground">Penjualan</p>
          <p className="text-base font-bold text-foreground">{formatRupiah(totalSales)}</p>
        </div>
        <div className="bg-card rounded-xl p-3 shadow-card">
          <p className="text-[10px] text-muted-foreground">Keuntungan</p>
          <p className="text-base font-bold text-secondary">{formatRupiah(totalProfit)}</p>
        </div>
        <div className="bg-card rounded-xl p-3 shadow-card">
          <p className="text-[10px] text-muted-foreground">Transaksi</p>
          <p className="text-base font-bold text-foreground">{sales.length}</p>
        </div>
        <div className="bg-card rounded-xl p-3 shadow-card">
          <p className="text-[10px] text-muted-foreground">Diskon</p>
          <p className="text-base font-bold text-destructive">{formatRupiah(totalDiscount)}</p>
        </div>
      </div>

      <Button onClick={exportPDF} variant="outline" className="w-full mb-4 gap-2">
        <Download className="h-4 w-4" /> Export PDF
      </Button>

      {/* Transaction List */}
      <h2 className="text-sm font-semibold text-foreground mb-2">Riwayat Transaksi</h2>
      {sales.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-4">Belum ada transaksi</p>
      ) : (
        <div className="space-y-2">
          {sales.map(s => (
            <div key={s.id} className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{formatRupiah(Number(s.grand_total))}</p>
                <p className="text-[10px] text-muted-foreground">{s.payment_method.toUpperCase()}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {new Date(s.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
