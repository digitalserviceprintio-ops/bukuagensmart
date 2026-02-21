import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Filter } from 'lucide-react';
import { mockCashBook, formatRupiah } from '@/data/mockData';

type FilterType = 'all' | 'income' | 'expense';

export default function BukuKas() {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = mockCashBook.filter((e) => filter === 'all' || e.type === filter);
  const totalIncome = mockCashBook.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpense = mockCashBook.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      <h1 className="text-lg font-bold text-foreground mb-4">Buku Kas Digital</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-secondary/10 rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground mb-1">Pemasukan</p>
          <p className="text-base font-bold text-secondary">{formatRupiah(totalIncome)}</p>
        </div>
        <div className="bg-destructive/10 rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground mb-1">Pengeluaran</p>
          <p className="text-base font-bold text-destructive">{formatRupiah(totalExpense)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {([['all', 'Semua'], ['income', 'Masuk'], ['expense', 'Keluar']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              filter === key ? 'gradient-primary text-primary-foreground shadow-button' : 'bg-muted text-muted-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {filtered.map((entry) => (
          <div key={entry.id} className="bg-card rounded-xl p-3 flex items-center gap-3 shadow-card animate-fade-in">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              entry.type === 'income' ? 'bg-secondary/10' : 'bg-destructive/10'
            }`}>
              {entry.type === 'income' ? (
                <ArrowDownLeft className="h-5 w-5 text-secondary" />
              ) : (
                <ArrowUpRight className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{entry.description}</p>
              <p className="text-[10px] text-muted-foreground">{entry.category} • {entry.timestamp.toLocaleDateString('id-ID')}</p>
            </div>
            <p className={`text-sm font-bold ${entry.type === 'income' ? 'text-secondary' : 'text-destructive'}`}>
              {entry.type === 'income' ? '+' : '-'}{formatRupiah(entry.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
