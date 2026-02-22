import { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react';
import { formatRupiah } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type FilterType = 'all' | 'income' | 'expense';

interface CashEntry {
  id: string;
  type: string;
  amount: number;
  description: string;
  category: string;
  created_at: string;
}

export default function BukuKas() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newType, setNewType] = useState<'income' | 'expense'>('income');
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState('');

  const fetchEntries = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('cash_book')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setEntries((data as CashEntry[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const filtered = entries.filter((e) => filter === 'all' || e.type === filter);
  const totalIncome = entries.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0);
  const totalExpense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0);

  const handleAdd = async () => {
    if (!newAmount || !newDesc) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('cash_book').insert({
      user_id: user.id,
      type: newType,
      amount: Number(newAmount),
      description: newDesc,
      category: newCat || (newType === 'income' ? 'Pemasukan' : 'Pengeluaran'),
    });
    setAddOpen(false);
    setNewAmount(''); setNewDesc(''); setNewCat('');
    fetchEntries();
  };

  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-foreground">Buku Kas Digital</h1>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gradient-primary text-primary-foreground h-8 px-3">
          <Plus className="h-4 w-4 mr-1" /> Tambah
        </Button>
      </div>

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
          <button key={key} onClick={() => setFilter(key)} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${filter === key ? 'gradient-primary text-primary-foreground shadow-button' : 'bg-muted text-muted-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Entries */}
      {loading ? (
        <p className="text-center text-muted-foreground text-sm py-8">Memuat...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">Belum ada catatan</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <div key={entry.id} className="bg-card rounded-xl p-3 flex items-center gap-3 shadow-card animate-fade-in">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${entry.type === 'income' ? 'bg-secondary/10' : 'bg-destructive/10'}`}>
                {entry.type === 'income' ? <ArrowDownLeft className="h-5 w-5 text-secondary" /> : <ArrowUpRight className="h-5 w-5 text-destructive" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{entry.description}</p>
                <p className="text-[10px] text-muted-foreground">{entry.category} • {new Date(entry.created_at).toLocaleDateString('id-ID')}</p>
              </div>
              <p className={`text-sm font-bold ${entry.type === 'income' ? 'text-secondary' : 'text-destructive'}`}>
                {entry.type === 'income' ? '+' : '-'}{formatRupiah(Number(entry.amount))}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Tambah Catatan Kas</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="flex gap-2">
              <Button variant={newType === 'income' ? 'default' : 'outline'} onClick={() => setNewType('income')} className="flex-1">Pemasukan</Button>
              <Button variant={newType === 'expense' ? 'default' : 'outline'} onClick={() => setNewType('expense')} className="flex-1">Pengeluaran</Button>
            </div>
            <div>
              <Label>Jumlah</Label>
              <Input type="number" inputMode="numeric" placeholder="0" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="h-11" />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Input placeholder="Keterangan" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="h-11" />
            </div>
            <div>
              <Label>Kategori (opsional)</Label>
              <Input placeholder="Kategori" value={newCat} onChange={(e) => setNewCat(e.target.value)} className="h-11" />
            </div>
            <Button onClick={handleAdd} className="w-full h-11 gradient-primary text-primary-foreground">Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
