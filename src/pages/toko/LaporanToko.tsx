import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProducts';
import { formatRupiah } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import jsPDF from 'jspdf';
import { APP_NAME } from '@/constants/app';

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
        // Get last 7 days
        const d = new Date(now);
        d.setDate(d.getDate() - 6);
        startDate = d.toISOString().slice(0, 10) + 'T00:00:00';
      } else {
        // Get last 6 months
        const d = new Date(now);
        d.setMonth(d.getMonth() - 5);
        startDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01T00:00:00`;
      }

      const { data: txs } = await supabase
        .from('pos_transactions' as any)
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      const salesData = (txs || []) as any as SaleRow[];
      setSales(salesData);

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

  const totalProfit = items.reduce((sum, item) => {
    const product = products.find(p => p.name === item.product_name);
    const buyPrice = product ? product.buy_price : 0;
    return sum + (Number(item.price) - buyPrice) * item.qty;
  }, 0);

  // Build chart data
  const chartData = (() => {
    if (period === 'daily') {
      const days: Record<string, { date: string; penjualan: number; keuntungan: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        days[key] = { date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }), penjualan: 0, keuntungan: 0 };
      }
      sales.forEach(s => {
        const key = s.created_at.slice(0, 10);
        if (days[key]) days[key].penjualan += Number(s.grand_total);
      });
      // Calculate profit per day using items
      items.forEach(item => {
        const product = products.find(p => p.name === item.product_name);
        const buyPrice = product ? product.buy_price : 0;
        const profit = (Number(item.price) - buyPrice) * item.qty;
        // We don't have item dates easily, so distribute by sales dates
        // For simplicity, aggregate profit proportionally
      });
      // Approximate profit ratio
      const profitRatio = totalSales > 0 ? totalProfit / totalSales : 0;
      Object.values(days).forEach(d => { d.keuntungan = Math.round(d.penjualan * profitRatio); });
      return Object.values(days);
    } else {
      const months: Record<string, { date: string; penjualan: number; keuntungan: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months[key] = { date: d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }), penjualan: 0, keuntungan: 0 };
      }
      sales.forEach(s => {
        const key = s.created_at.slice(0, 7);
        if (months[key]) months[key].penjualan += Number(s.grand_total);
      });
      const profitRatio = totalSales > 0 ? totalProfit / totalSales : 0;
      Object.values(months).forEach(d => { d.keuntungan = Math.round(d.penjualan * profitRatio); });
      return Object.values(months);
    }
  })();

  const exportPDF = () => {
    const doc = new jsPDF();
    const periodLabel = period === 'daily' ? 'Harian' : 'Bulanan';
    doc.setFontSize(14);
    doc.text(APP_NAME, 14, 16);
    doc.setFontSize(13);
    doc.text(`Laporan Penjualan ${periodLabel}`, 14, 24);
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }), 14, 32);
    doc.setLineWidth(0.3);
    doc.line(14, 35, 196, 35);

    let y = 44;
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

    doc.save(`NeoAgenMD2R-LaporanToko-${periodLabel}-${new Date().toISOString().slice(0, 10)}.pdf`);
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
          <TabsTrigger value="daily" className="flex-1">7 Hari</TabsTrigger>
          <TabsTrigger value="monthly" className="flex-1">6 Bulan</TabsTrigger>
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

      {/* Chart - Penjualan */}
      <div className="bg-card rounded-xl p-4 shadow-card mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Grafik Penjualan & Keuntungan</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: number) => formatRupiah(value)} contentStyle={{ fontSize: 11, borderRadius: 8, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="penjualan" name="Penjualan" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="keuntungan" name="Keuntungan" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trend Line */}
      <div className="bg-card rounded-xl p-4 shadow-card mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Tren Penjualan</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: number) => formatRupiah(value)} contentStyle={{ fontSize: 11, borderRadius: 8, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Line type="monotone" dataKey="penjualan" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="keuntungan" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
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
