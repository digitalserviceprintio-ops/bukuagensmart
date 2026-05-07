import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { formatRupiah } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { APP_NAME } from '@/constants/app';

type Period = 'daily' | 'weekly' | 'monthly';

export default function Laporan() {
  const [period, setPeriod] = useState<Period>('weekly');
  const [stats, setStats] = useState({ count: 0, volume: 0, commission: 0, avg: 0 });
  const [chartData, setChartData] = useState<{ day: string; amount: number }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      let from: string;
      if (period === 'daily') {
        from = now.toISOString().slice(0, 10) + 'T00:00:00';
      } else if (period === 'weekly') {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        from = d.toISOString();
      } else {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 1);
        from = d.toISOString();
      }

      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', from)
        .order('created_at', { ascending: true });

      const rows = (data || []) as any[];
      const volume = rows.reduce((s: number, t: any) => s + Number(t.amount), 0);
      const commission = rows.reduce((s: number, t: any) => s + Number(t.commission), 0);
      const days = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;

      setStats({ count: rows.length, volume, commission, avg: Math.round(volume / days) });

      // Group by day for chart
      const grouped: Record<string, number> = {};
      rows.forEach((r: any) => {
        const day = new Date(r.created_at).toLocaleDateString('id-ID', { weekday: 'short' });
        grouped[day] = (grouped[day] || 0) + Number(r.amount);
      });
      setChartData(Object.entries(grouped).map(([day, amount]) => ({ day, amount })));
    };
    fetchStats();
  }, [period]);

  const handleExport = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!data || data.length === 0) {
      toast({ title: 'Tidak ada data untuk di-export' });
      return;
    }

    const rows = data as any[];
    const csv = ['Tanggal,Tipe,Nominal,Fee,Komisi,Pelanggan,Status']
      .concat(rows.map((r: any) =>
        `${r.created_at},${r.type},${r.amount},${r.fee},${r.commission},${r.customer_name},${r.status}`
      )).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `transaksi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Data berhasil di-export' });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const text = await file.text();
    const lines = text.split('\n').slice(1).filter(l => l.trim());

    const inserts = lines.map(line => {
      const [, type, amount, fee, commission, customer_name, status] = line.split(',');
      return {
        user_id: user.id,
        type: type?.trim() || 'tarik',
        amount: Number(amount) || 0,
        fee: Number(fee) || 0,
        commission: Number(commission) || 0,
        customer_name: customer_name?.trim() || '',
        customer_phone: '',
        status: status?.trim() || 'success',
      };
    }).filter(r => r.amount > 0);

    if (inserts.length === 0) {
      toast({ title: 'File tidak berisi data valid', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('transactions').insert(inserts);
    if (error) {
      toast({ title: 'Gagal import', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `${inserts.length} transaksi berhasil di-import` });
    }
    e.target.value = '';
  };

  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-foreground">Laporan</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExport} className="h-8 px-2">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <label>
            <Button size="sm" variant="outline" className="h-8 px-2" asChild>
              <span><Upload className="h-4 w-4 mr-1" /> Import</span>
            </Button>
            <input type="file" accept=".csv,.xlsx" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2 mb-5">
        {([['daily', 'Harian'], ['weekly', 'Mingguan'], ['monthly', 'Bulanan']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setPeriod(key)} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${period === key ? 'gradient-primary text-primary-foreground shadow-button' : 'bg-muted text-muted-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-card rounded-xl p-4 shadow-card">
          <p className="text-[10px] text-muted-foreground">Total Transaksi</p>
          <p className="text-xl font-bold text-foreground">{stats.count}</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card">
          <p className="text-[10px] text-muted-foreground">Total Volume</p>
          <p className="text-base font-bold text-foreground">{formatRupiah(stats.volume)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card">
          <p className="text-[10px] text-muted-foreground">Total Komisi</p>
          <p className="text-base font-bold text-secondary">{formatRupiah(stats.commission)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card">
          <p className="text-[10px] text-muted-foreground">Rata-rata/Hari</p>
          <p className="text-base font-bold text-foreground">{formatRupiah(stats.avg)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl p-4 shadow-card">
        <h3 className="text-sm font-semibold text-foreground mb-3">Grafik Transaksi</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(value: number) => [formatRupiah(value), 'Volume']} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="amount" fill="hsl(160 60% 45%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-8">Belum ada data</p>
        )}
      </div>
    </div>
  );
}
