import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Banknote, CalendarDays, CreditCard, Download, ReceiptText, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProducts';
import { useTokoProfile } from '@/hooks/useTokoProfile';
import { formatRupiah } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/constants/app';

interface DailySale { id: string; discount: number; grand_total: number; payment_method: string; created_at: string; }
interface DailyItem { product_name: string; qty: number; price: number; }

export default function LaporanHarian() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { profile } = useTokoProfile();
  const [sales, setSales] = useState<DailySale[]>([]);
  const [items, setItems] = useState<DailyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setDate(end.getDate() + 1);
      const { data } = await supabase.from('pos_transactions' as any).select('*').eq('user_id', user.id).gte('created_at', start.toISOString()).lt('created_at', end.toISOString()).order('created_at', { ascending: false });
      const rows = (data || []) as any as DailySale[];
      setSales(rows);
      if (rows.length) {
        const { data: itemRows } = await supabase.from('pos_transaction_items' as any).select('product_name,qty,price').in('pos_transaction_id', rows.map(row => row.id));
        setItems((itemRows || []) as any as DailyItem[]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const totals = useMemo(() => {
    const salesTotal = sales.reduce((sum, row) => sum + Number(row.grand_total), 0);
    const discount = sales.reduce((sum, row) => sum + Number(row.discount), 0);
    const profit = items.reduce((sum, item) => {
      const product = products.find(row => row.name === item.product_name);
      return sum + (Number(item.price) - Number(product?.buy_price || 0)) * item.qty;
    }, 0);
    return { salesTotal, discount, profit, cash: sales.filter(row => row.payment_method === 'cash').reduce((sum, row) => sum + Number(row.grand_total), 0), digital: sales.filter(row => row.payment_method !== 'cash').reduce((sum, row) => sum + Number(row.grand_total), 0) };
  }, [items, products, sales]);

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.text(profile.nama || APP_NAME, 14, 18);
    doc.setFontSize(12); doc.text('Laporan Harian', 14, 27);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }), 14, 35);
    doc.line(14, 39, 196, 39);
    doc.text(`Penjualan: ${formatRupiah(totals.salesTotal)}`, 14, 49);
    doc.text(`Keuntungan: ${formatRupiah(totals.profit)}`, 14, 57);
    doc.text(`Transaksi: ${sales.length}`, 14, 65);
    doc.text(`Diskon: ${formatRupiah(totals.discount)}`, 14, 73);
    let y = 86;
    sales.forEach((sale, index) => { if (y > 275) { doc.addPage(); y = 20; } doc.text(`${index + 1}. ${new Date(sale.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}  ${sale.payment_method.toUpperCase()}  ${formatRupiah(Number(sale.grand_total))}`, 14, y); y += 7; });
    doc.save(`NeoMiniATM-Laporan-Harian-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return <div className="pb-24 min-h-screen bg-background">
    <header className="bg-card border-b border-border px-5 pt-6 pb-5">
      <div className="flex items-center gap-3"><Button variant="outline" size="icon" onClick={() => navigate('/toko')}><ArrowLeft /></Button><div><p className="text-xs font-semibold text-primary">{profile.nama || APP_NAME}</p><h1 className="text-xl font-bold">Laporan Harian</h1></div></div>
      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4 text-primary" />{new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</div>
    </header>
    <main className="px-5 pt-5">
      <div className="grid grid-cols-2 gap-3">
        {[['Penjualan', totals.salesTotal, ReceiptText], ['Keuntungan', totals.profit, TrendingUp], ['Tunai', totals.cash, Banknote], ['Digital', totals.digital, CreditCard]].map(([label, value, Icon]) => <div key={label as string} className="bg-card border border-border rounded-lg p-4 shadow-card"><Icon className="h-4 w-4 text-primary mb-3" /><p className="text-[11px] text-muted-foreground">{label as string}</p><p className="text-base font-bold truncate">{formatRupiah(value as number)}</p></div>)}
      </div>
      <div className="flex items-center justify-between mt-6 mb-3"><div><h2 className="font-bold">Transaksi Hari Ini</h2><p className="text-xs text-muted-foreground">{sales.length} transaksi · Diskon {formatRupiah(totals.discount)}</p></div><Button variant="outline" size="sm" onClick={exportPdf} disabled={!sales.length}><Download /> PDF</Button></div>
      {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Memuat laporan...</p> : sales.length === 0 ? <div className="border border-dashed border-border rounded-lg py-12 text-center"><ReceiptText className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-sm font-medium">Belum ada transaksi hari ini</p></div> : <div className="space-y-2">{sales.map(sale => <div key={sale.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><ReceiptText className="h-4 w-4 text-primary" /></div><div className="flex-1"><p className="text-sm font-semibold">{formatRupiah(Number(sale.grand_total))}</p><p className="text-[10px] text-muted-foreground">{sale.payment_method.toUpperCase()} · #{sale.id.slice(0, 8)}</p></div><p className="text-xs text-muted-foreground">{new Date(sale.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p></div>)}</div>}
    </main>
  </div>;
}