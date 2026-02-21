import { Transaction, CashBookEntry, DashboardSummary } from '@/types';

export const mockSummary: DashboardSummary = {
  balance: 15750000,
  todayTransactions: 24,
  todayAmount: 8500000,
  todayCommission: 127500,
};

export const mockTransactions: Transaction[] = [
  { id: '1', type: 'tarik', amount: 500000, fee: 5000, commission: 3500, customerName: 'Ahmad Sudirman', customerPhone: '081234567890', timestamp: new Date('2026-02-21T09:30:00'), status: 'success' },
  { id: '2', type: 'setor', amount: 1000000, fee: 0, commission: 2000, customerName: 'Siti Aminah', customerPhone: '082345678901', timestamp: new Date('2026-02-21T10:15:00'), status: 'success' },
  { id: '3', type: 'transfer', amount: 250000, fee: 6500, commission: 4000, customerName: 'Budi Hartono', customerPhone: '083456789012', timestamp: new Date('2026-02-21T11:00:00'), status: 'success' },
  { id: '4', type: 'tarik', amount: 2000000, fee: 10000, commission: 7000, customerName: 'Dewi Lestari', customerPhone: '084567890123', timestamp: new Date('2026-02-21T13:45:00'), status: 'pending' },
  { id: '5', type: 'setor', amount: 750000, fee: 0, commission: 1500, customerName: 'Rahmat Hidayat', customerPhone: '085678901234', timestamp: new Date('2026-02-21T14:20:00'), status: 'success' },
];

export const mockCashBook: CashBookEntry[] = [
  { id: '1', type: 'income', amount: 127500, description: 'Komisi transaksi hari ini', category: 'Komisi', timestamp: new Date('2026-02-21T18:00:00') },
  { id: '2', type: 'expense', amount: 50000, description: 'Beli kertas struk', category: 'Operasional', timestamp: new Date('2026-02-21T08:00:00') },
  { id: '3', type: 'income', amount: 5000000, description: 'Top up saldo dari bank', category: 'Top Up', timestamp: new Date('2026-02-20T09:00:00') },
  { id: '4', type: 'expense', amount: 25000, description: 'Pulsa HP', category: 'Operasional', timestamp: new Date('2026-02-20T12:00:00') },
];

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export function calculateFee(type: 'tarik' | 'setor' | 'transfer', amount: number): { fee: number; commission: number } {
  switch (type) {
    case 'tarik':
      return { fee: Math.round(amount * 0.01), commission: Math.round(amount * 0.007) };
    case 'setor':
      return { fee: 0, commission: Math.round(amount * 0.002) };
    case 'transfer':
      return { fee: 6500, commission: 4000 };
  }
}
