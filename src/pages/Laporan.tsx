import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { formatRupiah } from '@/data/mockData';

const weeklyData = [
  { day: 'Sen', amount: 3200000 },
  { day: 'Sel', amount: 4100000 },
  { day: 'Rab', amount: 2800000 },
  { day: 'Kam', amount: 5500000 },
  { day: 'Jum', amount: 8500000 },
  { day: 'Sab', amount: 6200000 },
  { day: 'Min', amount: 1500000 },
];

type Period = 'daily' | 'weekly' | 'monthly';

export default function Laporan() {
  const [period, setPeriod] = useState<Period>('weekly');

  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      <h1 className="text-lg font-bold text-foreground mb-4">Laporan</h1>

      {/* Period Filter */}
      <div className="flex gap-2 mb-5">
        {([['daily', 'Harian'], ['weekly', 'Mingguan'], ['monthly', 'Bulanan']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              period === key ? 'gradient-primary text-primary-foreground shadow-button' : 'bg-muted text-muted-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-card rounded-xl p-4 shadow-card">
          <p className="text-[10px] text-muted-foreground">Total Transaksi</p>
          <p className="text-xl font-bold text-foreground">156</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card">
          <p className="text-[10px] text-muted-foreground">Total Volume</p>
          <p className="text-base font-bold text-foreground">{formatRupiah(31800000)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card">
          <p className="text-[10px] text-muted-foreground">Total Komisi</p>
          <p className="text-base font-bold text-secondary">{formatRupiah(892500)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card">
          <p className="text-[10px] text-muted-foreground">Rata-rata/Hari</p>
          <p className="text-base font-bold text-foreground">{formatRupiah(4542857)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl p-4 shadow-card">
        <h3 className="text-sm font-semibold text-foreground mb-3">Grafik Transaksi Mingguan</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData}>
            <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(value: number) => [formatRupiah(value), 'Volume']}
              contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="amount" fill="hsl(160 60% 45%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
