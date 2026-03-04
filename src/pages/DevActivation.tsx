import { useState, useEffect } from 'react';
import { ArrowLeft, Key, Copy, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface ActivationCode {
  id: string;
  code: string;
  license_type: string;
  duration_days: number | null;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  for (let s = 0; s < 3; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) seg += chars[Math.floor(Math.random() * chars.length)];
    segments.push(seg);
  }
  return segments.join('-');
}

export default function DevActivation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [licenseType, setLicenseType] = useState('monthly');
  const [qty, setQty] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      setIsAdmin(!!data);
      setLoading(false);
      if (data) fetchCodes();
    };
    checkAdmin();
  }, [user]);

  const fetchCodes = async () => {
    const { data } = await supabase
      .from('activation_codes' as any)
      .select('*')
      .order('created_at', { ascending: false });
    setCodes((data || []) as any as ActivationCode[]);
  };

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    const newCodes = [];
    for (let i = 0; i < qty; i++) {
      newCodes.push({
        code: generateCode(),
        license_type: licenseType,
        duration_days: licenseType === 'lifetime' ? null : 30,
        created_by: user.id,
      });
    }

    const { error } = await supabase
      .from('activation_codes' as any)
      .insert(newCodes as any);

    if (error) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Berhasil', description: `${qty} kode berhasil dibuat` });
      fetchCodes();
    }
    setGenerating(false);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('activation_codes' as any).delete().eq('id', id);
    fetchCodes();
  };

  if (loading) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
        <Key className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-lg font-bold text-foreground mb-2">Akses Ditolak</h1>
        <p className="text-sm text-muted-foreground text-center mb-4">Halaman ini hanya untuk developer/admin.</p>
        <Button variant="outline" onClick={() => navigate('/')}>Kembali</Button>
      </div>
    );
  }

  const unusedCodes = codes.filter(c => !c.is_used);
  const usedCodes = codes.filter(c => c.is_used);

  return (
    <div className="pb-20 min-h-screen px-5 pt-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-muted">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Generator Kode Aktivasi</h1>
          <p className="text-xs text-muted-foreground">Buat kode lisensi premium</p>
        </div>
      </div>

      {/* Generate Form */}
      <div className="bg-card rounded-2xl p-5 shadow-card mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Buat Kode Baru</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Tipe Lisensi</label>
            <Select value={licenseType} onValueChange={setLicenseType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Bulanan (30 hari) - Rp 16.999</SelectItem>
                <SelectItem value="lifetime">Selamanya - Rp 55.999</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Jumlah Kode</label>
            <Input type="number" min={1} max={50} value={qty} onChange={e => setQty(Number(e.target.value))} className="h-12" />
          </div>
          <Button onClick={handleGenerate} disabled={generating} className="w-full h-12 gradient-primary">
            {generating ? 'Generating...' : `Generate ${qty} Kode`}
          </Button>
        </div>
      </div>

      {/* Unused Codes */}
      <h2 className="text-sm font-semibold text-foreground mb-2">Kode Belum Digunakan ({unusedCodes.length})</h2>
      <div className="space-y-2 mb-6">
        {unusedCodes.map(c => (
          <div key={c.id} className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono font-bold text-foreground tracking-wider">{c.code}</p>
              <p className="text-[10px] text-muted-foreground">
                {c.license_type === 'lifetime' ? 'Selamanya' : 'Bulanan'} · {new Date(c.created_at).toLocaleDateString('id-ID')}
              </p>
            </div>
            <button onClick={() => handleCopy(c.code)} className="p-2 rounded-lg bg-muted">
              {copied === c.code ? <Check className="h-4 w-4 text-secondary" /> : <Copy className="h-4 w-4 text-foreground" />}
            </button>
            <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg bg-destructive/10">
              <Trash2 className="h-4 w-4 text-destructive" />
            </button>
          </div>
        ))}
        {unusedCodes.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">Belum ada kode</p>}
      </div>

      {/* Used Codes */}
      {usedCodes.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-foreground mb-2">Kode Sudah Digunakan ({usedCodes.length})</h2>
          <div className="space-y-2">
            {usedCodes.map(c => (
              <div key={c.id} className="bg-muted rounded-xl p-3 flex items-center gap-3 opacity-60">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-bold text-foreground tracking-wider line-through">{c.code}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Digunakan {c.used_at ? new Date(c.used_at).toLocaleDateString('id-ID') : '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
