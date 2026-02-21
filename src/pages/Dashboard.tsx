import { useState } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, Bell, ChevronRight, Store } from 'lucide-react';
import { mockSummary, mockTransactions, formatRupiah } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import { useToko } from '@/hooks/useToko';
import BukaTokoModal from '@/components/BukaTokoModal';
import TutupTokoDialog from '@/components/TutupTokoDialog';

export default function Dashboard() {
  const navigate = useNavigate();
  const { tokoHariIni, loading, bukaToko, tutupToko } = useToko();
  const [tutupOpen, setTutupOpen] = useState(false);

  const needsBuka = !loading && (!tokoHariIni || tokoHariIni.status !== 'OPEN' && tokoHariIni.status !== 'CLOSED');
  const isOpen = tokoHariIni?.status === 'OPEN';

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

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <div className="gradient-hero px-5 pt-6 pb-10 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-primary-foreground/70 text-sm">Selamat datang,</p>
            <h1 className="text-lg font-bold text-primary-foreground">Agen Budi Santoso</h1>
          </div>
          <div className="flex items-center gap-2">
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
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-card/10 backdrop-blur-sm rounded-2xl p-5 border border-primary-foreground/10">
          <p className="text-primary-foreground/70 text-xs font-medium mb-1">Saldo Kas Agen</p>
          <p className="text-3xl font-bold text-primary-foreground">{formatRupiah(mockSummary.balance)}</p>
          {isOpen && tokoHariIni && (
            <p className="text-primary-foreground/50 text-[10px] mt-1">
              Kas awal: {formatRupiah(tokoHariIni.saldo_kas_awal)}
            </p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-5 -mt-5 grid grid-cols-3 gap-3">
        {[
          { label: 'Transaksi', value: mockSummary.todayTransactions.toString(), icon: ArrowDownLeft, color: 'text-info' },
          { label: 'Volume', value: formatRupiah(mockSummary.todayAmount), icon: ArrowUpRight, color: 'text-secondary' },
          { label: 'Komisi', value: formatRupiah(mockSummary.todayCommission), icon: TrendingUp, color: 'text-warning' },
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
          <button
            onClick={() => setTutupOpen(true)}
            className="w-full bg-destructive/10 rounded-xl p-3 flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Store className="h-4 w-4 text-destructive" />
            <span className="text-sm font-semibold text-destructive">Tutup Toko</span>
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-5 mt-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Tarik Tunai', icon: ArrowDownLeft, gradient: 'gradient-primary' },
            { label: 'Setor Tunai', icon: ArrowUpRight, gradient: 'gradient-success' },
            { label: 'Transfer', icon: Wallet, gradient: 'gradient-primary' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate('/transaksi')}
              className={`${action.gradient} rounded-xl p-4 flex flex-col items-center gap-2 shadow-button active:scale-95 transition-transform`}
            >
              <action.icon className="h-6 w-6 text-primary-foreground" />
              <span className="text-xs font-semibold text-primary-foreground">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Transaksi Terbaru</h2>
          <button onClick={() => navigate('/transaksi')} className="text-xs text-secondary font-medium flex items-center gap-0.5">
            Lihat Semua <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="space-y-2">
          {mockTransactions.slice(0, 4).map((tx) => (
            <div key={tx.id} className="bg-card rounded-xl p-3 flex items-center gap-3 shadow-card animate-fade-in">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                tx.type === 'tarik' ? 'bg-destructive/10' : tx.type === 'setor' ? 'bg-secondary/10' : 'bg-info/10'
              }`}>
                {tx.type === 'tarik' ? (
                  <ArrowDownLeft className="h-5 w-5 text-destructive" />
                ) : tx.type === 'setor' ? (
                  <ArrowUpRight className="h-5 w-5 text-secondary" />
                ) : (
                  <Wallet className="h-5 w-5 text-info" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{tx.customerName}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{tx.type} tunai</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${tx.type === 'setor' ? 'text-secondary' : 'text-foreground'}`}>
                  {tx.type === 'setor' ? '+' : '-'}{formatRupiah(tx.amount)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {tx.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tutup Toko Dialog */}
      {isOpen && tokoHariIni && (
        <TutupTokoDialog
          open={tutupOpen}
          onOpenChange={setTutupOpen}
          tokoData={tokoHariIni}
          onTutup={tutupToko}
        />
      )}
    </div>
  );
}
