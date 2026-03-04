import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TokoProfile {
  nama: string;
  alamat: string;
  noHp: string;
  keterangan: string;
}

export function useTokoProfile() {
  const [profile, setProfile] = useState<TokoProfile>({ nama: '', alamat: '', noHp: '', keterangan: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('toko_profiles' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        const d = data as any;
        setProfile({ nama: d.nama || '', alamat: d.alamat || '', noHp: d.no_hp || '', keterangan: d.keterangan || '' });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const save = async (p: TokoProfile) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('toko_profiles' as any)
      .upsert({
        user_id: user.id,
        nama: p.nama,
        alamat: p.alamat,
        no_hp: p.noHp,
        keterangan: p.keterangan,
      } as any, { onConflict: 'user_id' });

    if (!error) setProfile(p);
    return error;
  };

  return { profile, loading, save };
}
