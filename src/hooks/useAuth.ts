import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

function phoneToEmail(phone: string) {
  return `${phone.replace(/\D/g, '')}@agent.app`;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (phone: string, pin: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(phone),
      password: pin,
    });
    if (error) throw error;
  }, []);

  const register = useCallback(async (phone: string, pin: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email: phoneToEmail(phone),
      password: pin,
      options: { data: { name, phone } },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { user, session, loading, login, register, logout };
}
