import { useState, useEffect } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, Bell, ChevronRight, Store, ShoppingBag, Clock, PlusCircle } from 'lucide-react';
import { formatRupiah } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import { useToko } from '@/hooks/useToko';
import { useTokoProfile } from '@/hooks/useTokoProfile';
import { useLicense } from '@/hooks/useLicense';
import { supabase } from '@/integrations/supabase/client';
import BukaTokoModal from '@/components/BukaTokoModal';
import TutupTokoDialog from '@/components/TutupTokoDialog';
import TopUpModal from '@/components/TopUpModal';
import LicenseExpiredDialog from '@/components/LicenseExpiredDialog';
import PromoCarousel from '@/components/PromoCarousel';
import GlassSkeletonLoader from '@/components/GlassSkeletonLoader';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/constants/app';


interface TxRow {
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

function DigitalClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-right hidden min-[390px]:block">
      <p className="text-xs font-mono font-bold text-foreground">
        {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="text-[9px] text-muted-foreground">
        {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { tokoHariIni, loading, bukaToko, tutupToko, refresh } = useToko();
  const { profile: tokoProfile } = useTokoProfile();
  const [tutupOpen, setTutupOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const { license, loading: licLoading, isTrial, isExpired, daysLeft } = useLicense();
  const [summary, setSummary] = useState({ count: 0, volume: 0, commission: 0 });

  const needsBuka = !loading && (!tokoHariIni || (tokoHariIni.status !== 'OPEN' && tokoHariIni.status !== 'CLOSED'));
  const isOpen = tokoHariIni?.status === 'OPEN';

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().slice(0, 10);

      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false })
        .limit(10);

      const rows = (txs || []) as any[];
      setTransactions(rows);
      setSummary({
        count: rows.length,
        volume: rows.reduce((s: number, t: any) => s + Number(t.amount), 0),
        commission: rows.reduce((s: number, t: any) => s + Number(t.commission), 0),
      });
    };
    if (!loading) fetchData();

    // Refresh saldo every 10 seconds
    const interval = setInterval(() => { if (!loading) { fetchData(); refresh(); } }, 10000);
    return () => clearInterval(interval);
  }, [loading]);

  if (loading) return <GlassSkeletonLoader type="dashboard" />;

  if (needsBuka) {
    return (
      <BukaTokoModal
        onSubmit={(kas, rek, catatan) => {
          bukaToko(kas, rek, catatan);
        }}
      />
    );
  }

  const balance = tokoHariIni ? Number(tokoHariIni.saldo_kas_awal) + (Number(tokoHariIni.selisih_kas) || 0) : 0;
  const saldoRekening = tokoHariIni ? (Number(tokoHariIni.saldo_rekening_akhir) || Number(tokoHariIni.saldo_rekening_awal)) : 0;
  const showLicenseDialog = !licLoading && isTrial && (isExpired || (daysLeft !== null && daysLeft <= 5));

  return (
    <div className="pb-24 min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card px-5 pt-6 pb-6 border-b border-border">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-primary mb-1">{APP_NAME}</p>
            <button onClick={() => navigate('/profil/toko')} className="max-w-full text-left group">
            {tokoProfile.nama ? (
              <>
                <div className="flex items-center gap-1">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <h1 className="text-xl font-bold text-foreground truncate">{tokoProfile.nama}</h1>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                {tokoProfile.alamat && <p className="text-xs text-muted-foreground truncate ml-5 mt-0.5">{tokoProfile.alamat}</p>}
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-xs">Selamat datang</p>
                <div className="flex items-center gap-1">
                  <h1 className="text-xl font-bold text-foreground">Atur Profil Toko</h1>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </>
            )}
          </button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DigitalClock />
            {isOpen && (
              <span className="px-2 py-1 bg-success/10 text-success text-[10px] font-bold rounded-full flex items-center gap-1">
                <Store className="h-3 w-3" /> BUKA
              </span>
            )}
            {tokoHariIni?.status === 'CLOSED' && (
              <span className="px-2 py-1 bg-destructive/20 text-destructive text-[10px] font-bold rounded-full flex items-center gap-1">
                <Store className="h-3 w-3" /> TUTUP
              </span>
            )}
            <Button variant="outline" size="icon" aria-label="Notifikasi" className="h-9 w-9 rounded-full">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>


        {/* Balance Cards */}
        <div className="grid grid-cols-2 divide-x divide-border rounded-xl border border-border bg-background overflow-hidden">
          <div className="p-4 min-w-0">
            <div className="flex items-center gap-2 mb-2"><Wallet className="h-4 w-4 text-primary" /><p className="text-muted-foreground text-[11px] font-medium">Saldo Kas</p></div>
            <p className="text-lg font-bold text-foreground truncate">{formatRupiah(balance)}</p>
            {isOpen && tokoHariIni && (
              <p className="text-muted-foreground text-[9px] mt-1">
                Awal: {formatRupiah(Number(tokoHariIni.saldo_kas_awal))}
              </p>
            )}
          </div>
          <div className="p-4 min-w-0">
            <div className="flex items-center gap-2 mb-2"><ArrowLeftRight className="h-4 w-4 text-info" /><p className="text-muted-foreground text-[11px] font-medium">Saldo Rekening</p></div>
            <p className="text-lg font-bold text-foreground truncate">{formatRupiah(saldoRekening)}</p>
            {isOpen && tokoHariIni && (
              <p className="text-muted-foreground text-[9px] mt-1">
                Awal: {formatRupiah(Number(tokoHariIni.saldo_rekening_awal))}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <div className="px-5 mt-5 grid grid-cols-3 gap-2">
        {[
          { label: 'Transaksi', value: summary.count.toString(), icon: ArrowDownLeft, color: 'text-info' },
          { label: 'Volume', value: formatRupiah(summary.volume), icon: ArrowUpRight, color: 'text-secondary' },
          { label: 'Komisi', value: formatRupiah(summary.commission), icon: TrendingUp, color: 'text-warning' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl p-3 border border-border animate-slide-up min-w-0">
            <stat.icon className={`h-4 w-4 ${stat.color} mb-1`} />
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            <p className="text-sm font-bold text-foreground truncate">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tutup Toko Button */}
      {isOpen && (
        <div className="px-5 mt-4">
          <Button variant="ghost" onClick={() => setTutupOpen(true)} className="w-full bg-destructive/10 hover:bg-destructive/15 text-destructive rounded-xl">
            <Store className="h-4 w-4 text-destructive" />
            <span className="text-sm font-semibold text-destructive">Tutup Toko</span>
          </Button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-5 mt-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Tarik Tunai', icon: ArrowDownLeft, tone: 'bg-primary/10 text-primary', path: '/transaksi' },
            { label: 'Setor Tunai', icon: ArrowUpRight, tone: 'bg-success/10 text-success', path: '/transaksi' },
            { label: 'Transfer', icon: Wallet, tone: 'bg-info/10 text-info', path: '/transaksi' },
            { label: 'Top Up', icon: PlusCircle, tone: 'bg-warning/10 text-warning', action: () => setTopUpOpen(true) },
            { label: 'Toko', icon: ShoppingBag, tone: 'bg-secondary/10 text-secondary', path: '/toko' },
          ].map((action) => (
            <Button key={action.label} variant="ghost" onClick={() => action.action ? action.action() : action.path && navigate(action.path)} className="h-auto min-h-[74px] p-2 flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-muted/50 whitespace-normal">
              <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${action.tone}`}><action.icon className="h-4 w-4" /></span>
              <span className="text-[10px] leading-tight font-semibold text-foreground text-center">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Promo Carousel */}
      <div className="px-5 mt-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Promo & Info</h2>
        <PromoCarousel />
      </div>

      {/* Recent Transactions */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Transaksi Terbaru</h2>
          <button onClick={() => navigate('/transaksi')} className="text-xs text-secondary font-medium flex items-center gap-0.5">
            Lihat Semua <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4">Belum ada transaksi hari ini</p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 4).map((tx) => (
              <div key={tx.id} className="bg-card rounded-xl p-3 flex items-center gap-3 border border-border animate-fade-in">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  tx.type === 'tarik' ? 'bg-destructive/10' : tx.type === 'setor' ? 'bg-secondary/10' : 'bg-info/10'
                }`}>
                  {tx.type === 'tarik' ? <ArrowDownLeft className="h-5 w-5 text-destructive" /> :
                   tx.type === 'setor' ? <ArrowUpRight className="h-5 w-5 text-secondary" /> :
                   <Wallet className="h-5 w-5 text-info" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.customer_name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{tx.type} tunai</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.type === 'setor' ? 'text-secondary' : 'text-foreground'}`}>
                    {tx.type === 'setor' ? '+' : '-'}{formatRupiah(Number(tx.amount))}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tutup Toko Dialog */}
      {isOpen && tokoHariIni && (
        <TutupTokoDialog open={tutupOpen} onOpenChange={setTutupOpen} tokoData={tokoHariIni} onTutup={tutupToko} />
      )}

      {/* Top Up Modal */}
      {isOpen && tokoHariIni && (
        <TopUpModal
          open={topUpOpen}
          onOpenChange={setTopUpOpen}
          tokoId={tokoHariIni.id}
          currentKas={balance}
          currentRekening={saldoRekening}
          selisihKas={Number(tokoHariIni.selisih_kas) || 0}
          onSuccess={refresh}
        />
      )}

      {/* License Expired Dialog */}
      {showLicenseDialog && (
        <LicenseExpiredDialog open={showLicenseDialog} daysLeft={daysLeft} isExpired={isExpired} />
      )}
    </div>
  );
}
