import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface License {
  id: string;
  license_type: string;
  activation_code: string | null;
  activated_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export function useLicense() {
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLicense = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('licenses' as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setLicense(data as any as License);
    } else {
      // Auto create trial if missing
      const { data: newLic } = await supabase
        .from('licenses' as any)
        .insert({
          user_id: user.id,
          license_type: 'trial',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        } as any)
        .select()
        .single();
      if (newLic) setLicense(newLic as any as License);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLicense(); }, []);

  const activateCode = async (code: string): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Tidak terautentikasi';

    // Find the activation code
    const { data: codeData } = await supabase
      .from('activation_codes' as any)
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_used', false)
      .maybeSingle();

    if (!codeData) return 'Kode aktivasi tidak valid atau sudah digunakan';

    const ac = codeData as any;
    const expiresAt = ac.license_type === 'lifetime'
      ? null
      : new Date(Date.now() + (ac.duration_days || 30) * 24 * 60 * 60 * 1000).toISOString();

    // Update license
    await supabase
      .from('licenses' as any)
      .upsert({
        user_id: user.id,
        license_type: ac.license_type,
        activation_code: code.toUpperCase(),
        activated_at: new Date().toISOString(),
        expires_at: expiresAt,
        is_active: true,
      } as any, { onConflict: 'user_id' });

    // Mark code as used
    await supabase
      .from('activation_codes' as any)
      .update({ is_used: true, used_by: user.id, used_at: new Date().toISOString() } as any)
      .eq('id', ac.id);

    await fetchLicense();
    return null;
  };

  const isPremium = license?.license_type === 'monthly' || license?.license_type === 'lifetime';
  const isTrial = license?.license_type === 'trial';
  const isExpired = license?.expires_at ? new Date(license.expires_at) < new Date() : false;
  const daysLeft = license?.expires_at
    ? Math.max(0, Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return { license, loading, isPremium, isTrial, isExpired, daysLeft, activateCode };
}
