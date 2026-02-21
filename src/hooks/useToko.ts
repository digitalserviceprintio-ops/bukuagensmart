import { useState, useEffect, useCallback } from 'react';

export interface BukaToko {
  id: string;
  user_id: string;
  tanggal: string;
  saldo_kas_awal: number;
  saldo_rekening_awal: number;
  catatan?: string;
  waktu_buka: string;
  waktu_tutup?: string;
  saldo_kas_akhir?: number;
  saldo_rekening_akhir?: number;
  selisih_kas?: number;
  status: 'OPEN' | 'CLOSED';
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getAll(): BukaToko[] {
  try {
    return JSON.parse(localStorage.getItem('buka_toko') || '[]');
  } catch {
    return [];
  }
}

function saveAll(data: BukaToko[]) {
  localStorage.setItem('buka_toko', JSON.stringify(data));
}

export function useToko() {
  const [tokoHariIni, setTokoHariIni] = useState<BukaToko | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const today = getTodayStr();
    const all = getAll();
    const found = all.find((t) => t.tanggal === today) || null;
    setTokoHariIni(found);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const bukaToko = useCallback((saldo_kas_awal: number, saldo_rekening_awal: number, catatan?: string) => {
    const today = getTodayStr();
    const all = getAll();
    if (all.find((t) => t.tanggal === today)) return false;

    const entry: BukaToko = {
      id: crypto.randomUUID(),
      user_id: 'agent-1',
      tanggal: today,
      saldo_kas_awal,
      saldo_rekening_awal,
      catatan,
      waktu_buka: new Date().toISOString(),
      status: 'OPEN',
    };
    all.push(entry);
    saveAll(all);
    setTokoHariIni(entry);
    return true;
  }, []);

  const tutupToko = useCallback((saldo_kas_akhir: number, saldo_rekening_akhir: number) => {
    const today = getTodayStr();
    const all = getAll();
    const idx = all.findIndex((t) => t.tanggal === today && t.status === 'OPEN');
    if (idx === -1) return null;

    const entry = all[idx];
    entry.status = 'CLOSED';
    entry.waktu_tutup = new Date().toISOString();
    entry.saldo_kas_akhir = saldo_kas_akhir;
    entry.saldo_rekening_akhir = saldo_rekening_akhir;
    entry.selisih_kas = saldo_kas_akhir - entry.saldo_kas_awal;

    all[idx] = entry;
    saveAll(all);
    setTokoHariIni(entry);
    return entry;
  }, []);

  return { tokoHariIni, loading, bukaToko, tutupToko, refresh };
}
