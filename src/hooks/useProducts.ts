import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  user_id: string;
  name: string;
  category: string;
  buy_price: number;
  sell_price: number;
  stock: number;
  min_stock: number;
  barcode: string;
  photo_url: string;
  created_at: string;
  updated_at: string;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('products' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setProducts((data || []) as any as Product[]);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('products' as any)
      .insert({ ...product, user_id: user.id } as any)
      .select()
      .single();

    if (error) { console.error(error); return null; }
    await refresh();
    return data as any as Product;
  }, [refresh]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    const { error } = await supabase
      .from('products' as any)
      .update(updates as any)
      .eq('id', id);

    if (error) { console.error(error); return false; }
    await refresh();
    return true;
  }, [refresh]);

  const deleteProduct = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('products' as any)
      .delete()
      .eq('id', id);

    if (error) { console.error(error); return false; }
    await refresh();
    return true;
  }, [refresh]);

  const findByBarcode = useCallback(async (barcode: string): Promise<Product | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('products' as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('barcode', barcode)
      .maybeSingle();

    return data as any as Product | null;
  }, []);

  return { products, loading, refresh, addProduct, updateProduct, deleteProduct, findByBarcode };
}
