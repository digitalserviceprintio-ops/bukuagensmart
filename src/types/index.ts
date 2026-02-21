export interface Transaction {
  id: string;
  type: 'tarik' | 'setor' | 'transfer';
  amount: number;
  fee: number;
  commission: number;
  customerName: string;
  customerPhone: string;
  timestamp: Date;
  status: 'success' | 'pending' | 'failed';
}

export interface CashBookEntry {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  timestamp: Date;
}

export interface AgentProfile {
  name: string;
  phone: string;
  balance: number;
  role: 'admin' | 'agent';
}

export interface DashboardSummary {
  balance: number;
  todayTransactions: number;
  todayAmount: number;
  todayCommission: number;
}
