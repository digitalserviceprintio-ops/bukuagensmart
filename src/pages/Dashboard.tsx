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
    <div className="text-right">
      <p className="text-xs font-mono font-bold text-primary-foreground">
        {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="text-[9px] text-primary-foreground/60">
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

  if (loading) return null;

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
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <div className="gradient-hero px-5 pt-6 pb-10 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate('/profil/toko')} className="flex-1 min-w-0 text-left group">
            {tokoProfile.nama ? (
              <>
                <div className="flex items-center gap-1">
                  <Store className="h-3.5 w-3.5 text-primary-foreground/70" />
                  <p className="text-sm font-bold text-primary-foreground truncate">{tokoProfile.nama}</p>
                  <ChevronRight className="h-3 w-3 text-primary-foreground/40 group-hover:text-primary-foreground/70 transition-colors" />
                </div>
                {tokoProfile.alamat && <p className="text-[10px] text-primary-foreground/50 truncate ml-[18px]">{tokoProfile.alamat}</p>}
                <p className="text-[9px] text-primary-foreground/30 ml-[18px]">Counter & ATK • Tap untuk atur profil</p>
              </>
            ) : (
              <>
                <p className="text-primary-foreground/70 text-sm">Selamat datang,</p>
                <div className="flex items-center gap-1">
                  <h1 className="text-lg font-bold text-primary-foreground">Counter & ATK</h1>
                  <ChevronRight className="h-3 w-3 text-primary-foreground/40" />
                </div>
                <p className="text-[9px] text-primary-foreground/30">Tap untuk atur profil toko</p>
              </>
            )}
          </button>
          <div className="flex items-center gap-2">
            <DigitalClock />
            {isOpen && (
              <span className="px-2 py-1 bg-secondary/20 text-secondary text-[10px] font-bold rounded-full flex items-center gap-1">
                <Store className="h-3 w-3" /> BUKA
              </span>
            )}
            {tokoHariIni?.status === 'CLOSED' && (
              <span className="px-2 py-1 bg-destructive/20 text-destructive text-[10px] font-bold rounded-full flex items-center gap-1">
                <Store className="h-3 w-3" /> TUTUP
              </span>
            )}
            <button className="relative p-2 rounded-xl bg-primary-foreground/10">
              <Bell className="h-5 w-5 text-primary-foreground" />
            </button>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card/10 backdrop-blur-sm rounded-2xl p-4 border border-primary-foreground/10">
            <p className="text-primary-foreground/70 text-[10px] font-medium mb-1">Saldo Kas</p>
            <p className="text-xl font-bold text-primary-foreground">{formatRupiah(balance)}</p>
            {isOpen && tokoHariIni && (
              <p className="text-primary-foreground/40 text-[9px] mt-1">
                Awal: {formatRupiah(Number(tokoHariIni.saldo_kas_awal))}
              </p>
            )}
          </div>
          <div className="bg-card/10 backdrop-blur-sm rounded-2xl p-4 border border-primary-foreground/10">
            <p className="text-primary-foreground/70 text-[10px] font-medium mb-1">Saldo Rekening</p>
            <p className="text-xl font-bold text-primary-foreground">{formatRupiah(saldoRekening)}</p>
            {isOpen && tokoHariIni && (
              <p className="text-primary-foreground/40 text-[9px] mt-1">
                Awal: {formatRupiah(Number(tokoHariIni.saldo_rekening_awal))}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-5 -mt-5 grid grid-cols-3 gap-3">
        {[
          { label: 'Transaksi', value: summary.count.toString(), icon: ArrowDownLeft, color: 'text-info' },
          { label: 'Volume', value: formatRupiah(summary.volume), icon: ArrowUpRight, color: 'text-secondary' },
          { label: 'Komisi', value: formatRupiah(summary.commission), icon: TrendingUp, color: 'text-warning' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl p-3 shadow-card animate-slide-up">
            <stat.icon className={`h-4 w-4 ${stat.color} mb-1`} />
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            <p className="text-sm font-bold text-foreground truncate">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tutup Toko Button */}
      {isOpen && (
        <div className="px-5 mt-4">
          <button onClick={() => setTutupOpen(true)} className="w-full bg-destructive/10 rounded-xl p-3 flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <Store className="h-4 w-4 text-destructive" />
            <span className="text-sm font-semibold text-destructive">Tutup Toko</span>
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-5 mt-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Tarik Tunai', icon: ArrowDownLeft, gradient: 'gradient-primary', path: '/transaksi' },
            { label: 'Setor Tunai', icon: ArrowUpRight, gradient: 'gradient-success', path: '/transaksi' },
            { label: 'Transfer', icon: Wallet, gradient: 'gradient-primary', path: '/transaksi' },
            { label: 'Top Up', icon: PlusCircle, gradient: 'gradient-success', action: () => setTopUpOpen(true) },
            { label: 'Toko', icon: ShoppingBag, gradient: 'gradient-primary', path: '/toko' },
          ].map((action) => (
            <button key={action.label} onClick={() => action.action ? action.action() : navigate(action.path!)} className={`${action.gradient} rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-button active:scale-95 transition-transform`}>
              <action.icon className="h-5 w-5 text-primary-foreground" />
              <span className="text-[10px] font-semibold text-primary-foreground">{action.label}</span>
            </button>
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
              <div key={tx.id} className="bg-card rounded-xl p-3 flex items-center gap-3 shadow-card animate-fade-in">
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
