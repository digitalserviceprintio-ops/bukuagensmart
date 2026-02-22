import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export function useToko() {
  const [tokoHariIni, setTokoHariIni] = useState<BukaToko | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('buka_toko')
      .select('*')
      .eq('user_id', user.id)
      .eq('tanggal', getTodayStr())
      .maybeSingle();

    setTokoHariIni(data as BukaToko | null);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const bukaToko = useCallback(async (saldo_kas_awal: number, saldo_rekening_awal: number, catatan?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('buka_toko')
      .insert({
        user_id: user.id,
        tanggal: getTodayStr(),
        saldo_kas_awal,
        saldo_rekening_awal,
        catatan,
        status: 'OPEN',
      })
      .select()
      .single();

    if (error) { console.error(error); return false; }
    setTokoHariIni(data as BukaToko);
    return true;
  }, []);

  const tutupToko = useCallback(async (saldo_kas_akhir: number, saldo_rekening_akhir: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const selisih_kas = tokoHariIni ? saldo_kas_akhir - tokoHariIni.saldo_kas_awal : 0;

    const { data, error } = await supabase
      .from('buka_toko')
      .update({
        status: 'CLOSED',
        waktu_tutup: new Date().toISOString(),
        saldo_kas_akhir,
        saldo_rekening_akhir,
        selisih_kas,
      })
      .eq('user_id', user.id)
      .eq('tanggal', getTodayStr())
      .eq('status', 'OPEN')
      .select()
      .single();

    if (error) { console.error(error); return null; }
    setTokoHariIni(data as BukaToko);
    return data as BukaToko;
  }, [tokoHariIni]);

  return { tokoHariIni, loading, bukaToko, tutupToko, refresh };
}
