import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Wallet, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatRupiah } from '@/data/mockData';
import ReceiptButton from '@/components/ReceiptGenerator';

interface Activity {
  id: string;
  type: string;
  amount: number;
  fee: number;
  commission: number;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  status: string;
}

export default function RiwayatAktivitas() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
      setActivities((data || []) as Activity[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const iconMap: Record<string, typeof ArrowDownLeft> = { tarik: ArrowDownLeft, setor: ArrowUpRight, transfer: Wallet };

  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>
      <h1 className="text-lg font-bold text-foreground mb-4">Riwayat Aktivitas</h1>

      {loading ? <p className="text-center text-muted-foreground text-sm py-8">Memuat...</p> :
        activities.length === 0 ? <p className="text-center text-muted-foreground text-sm py-8">Belum ada aktivitas</p> :
        <div className="space-y-2">
          {activities.map((a) => {
            const Icon = iconMap[a.type] || Store;
            return (
              <div key={a.id} className="bg-card rounded-xl p-3 shadow-card">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.type === 'tarik' ? 'bg-destructive/10' : a.type === 'setor' ? 'bg-secondary/10' : 'bg-info/10'}`}>
                    <Icon className={`h-5 w-5 ${a.type === 'tarik' ? 'text-destructive' : a.type === 'setor' ? 'text-secondary' : 'text-info'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.customer_name}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString('id-ID')}</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">{formatRupiah(a.amount)}</p>
                </div>
                <div className="mt-2 flex justify-end">
                  <ReceiptButton tx={a} />
                </div>
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}
