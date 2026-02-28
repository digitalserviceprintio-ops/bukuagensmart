import { useState, useEffect } from 'react';
import { Package, ShoppingCart, AlertTriangle, TrendingUp, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { formatRupiah } from '@/data/mockData';

export default function TokoDashboard() {
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const [salesToday, setSalesToday] = useState(0);

  useEffect(() => {
    const fetchSales = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from('pos_transactions' as any)
        .select('grand_total')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`);
      setSalesToday((data || []).reduce((s: number, r: any) => s + Number(r.grand_total), 0));
    };
    fetchSales();
  }, []);

  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const lowStock = products.filter(p => p.stock <= p.min_stock && p.stock > 0);
  const outOfStock = products.filter(p => p.stock === 0);

  if (loading) return null;

  const menuItems = [
    { label: 'Manajemen Produk', desc: 'Tambah, edit, hapus produk', icon: Package, path: '/toko/produk', color: 'bg-info/10 text-info' },
    { label: 'Kasir / POS', desc: 'Transaksi penjualan', icon: ShoppingCart, path: '/toko/kasir', color: 'bg-secondary/10 text-secondary' },
    { label: 'Manajemen Stok', desc: 'Riwayat stok masuk/keluar', icon: TrendingUp, path: '/toko/stok', color: 'bg-warning/10 text-warning' },
    { label: 'Laporan Toko', desc: 'Penjualan & keuntungan', icon: TrendingUp, path: '/toko/laporan', color: 'bg-primary/10 text-primary' },
  ];

  return (
    <div className="pb-20 min-h-screen">
      <div className="gradient-hero px-5 pt-6 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-primary-foreground/10">
            <ArrowLeft className="h-5 w-5 text-primary-foreground" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground">Toko Counter & ATK</h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card/10 backdrop-blur-sm rounded-xl p-3 border border-primary-foreground/10">
            <Package className="h-4 w-4 text-primary-foreground/70 mb-1" />
            <p className="text-primary-foreground/60 text-[10px]">Total Produk</p>
            <p className="text-xl font-bold text-primary-foreground">{products.length}</p>
          </div>
          <div className="bg-card/10 backdrop-blur-sm rounded-xl p-3 border border-primary-foreground/10">
            <ShoppingCart className="h-4 w-4 text-primary-foreground/70 mb-1" />
            <p className="text-primary-foreground/60 text-[10px]">Total Stok</p>
            <p className="text-xl font-bold text-primary-foreground">{totalStock}</p>
          </div>
          <div className="bg-card/10 backdrop-blur-sm rounded-xl p-3 border border-primary-foreground/10 col-span-2">
            <TrendingUp className="h-4 w-4 text-primary-foreground/70 mb-1" />
            <p className="text-primary-foreground/60 text-[10px]">Penjualan Hari Ini</p>
            <p className="text-xl font-bold text-primary-foreground">{formatRupiah(salesToday)}</p>
          </div>
        </div>
      </div>

      {/* Low stock alerts */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="px-5 mt-4">
          <div className="bg-warning/10 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground">Perhatian Stok</p>
              {outOfStock.length > 0 && (
                <p className="text-[10px] text-destructive">{outOfStock.length} produk habis</p>
              )}
              {lowStock.length > 0 && (
                <p className="text-[10px] text-warning">{lowStock.length} produk stok menipis</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="px-5 mt-4 space-y-2">
        {menuItems.map((item) => (
          <button key={item.label} onClick={() => navigate(item.path)} className="w-full bg-card rounded-xl p-4 flex items-center gap-3 shadow-card text-left">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}
