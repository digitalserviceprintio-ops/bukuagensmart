import { useState, useEffect } from 'react';
import { ArrowLeft, Key, Copy, Check, Trash2, Users, Settings, Shield, RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import GlassSkeletonLoader from '@/components/GlassSkeletonLoader';

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

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  created_at: string;
}

interface UserLicense {
  user_id: string;
  license_type: string;
  expires_at: string | null;
  is_active: boolean;
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

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Activation codes
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [licenseType, setLicenseType] = useState('monthly');
  const [qty, setQty] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Users
  const [users, setUsers] = useState<(UserProfile & { license?: UserLicense })[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Maintenance
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('Aplikasi sedang dalam pemeliharaan.');
  const [latestVersion, setLatestVersion] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      setIsAdmin(!!data);
      setLoading(false);
      if (data) {
        fetchCodes();
        fetchUsers();
        fetchSettings();
      }
    };
    init();
  }, [user]);

  // ── Activation Codes ──
  const fetchCodes = async () => {
    const { data } = await supabase
      .from('activation_codes')
      .select('*')
      .order('created_at', { ascending: false });
    setCodes((data || []) as ActivationCode[]);
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
    const { error } = await supabase.from('activation_codes').insert(newCodes);
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
    await supabase.from('activation_codes').delete().eq('id', id);
    fetchCodes();
  };

  // ── Users ──
  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data: result } = await supabase.functions.invoke('admin-panel', {
      body: { action: 'users' },
    });

    const profiles = result?.profiles || [];
    const licenses = result?.licenses || [];

    const licenseMap = new Map<string, UserLicense>();
    licenses.forEach((l: any) => licenseMap.set(l.user_id, l));

    const merged = profiles.map((p: any) => ({
      ...p,
      license: licenseMap.get(p.user_id),
    }));
    setUsers(merged);
    setLoadingUsers(false);
  };

  // ── Settings ──
  const fetchSettings = async () => {
    const { data } = await supabase.from('app_settings').select('key, value');
    if (data) {
      const map = Object.fromEntries(data.map((r: any) => [r.key, r.value]));
      setMaintenanceMode(map['maintenance_mode'] === 'true');
      setMaintenanceMsg(map['maintenance_message'] || 'Aplikasi sedang dalam pemeliharaan.');
      setLatestVersion(map['latest_version'] || '');
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    const settings = [
      { key: 'maintenance_mode', value: maintenanceMode ? 'true' : 'false' },
      { key: 'maintenance_message', value: maintenanceMsg },
      { key: 'latest_version', value: latestVersion },
    ];
    for (const s of settings) {
      await supabase.from('app_settings').upsert(s, { onConflict: 'key' });
    }
    toast({ title: 'Tersimpan', description: 'Pengaturan berhasil diperbarui' });
    setSavingSettings(false);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone.toLowerCase().includes(userSearch.toLowerCase())
  );

  const unusedCodes = codes.filter(c => !c.is_used);
  const usedCodes = codes.filter(c => c.is_used);

  if (loading) return <GlassSkeletonLoader />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
        <Shield className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-lg font-bold text-foreground mb-2">Akses Ditolak</h1>
        <p className="text-sm text-muted-foreground text-center mb-4">Halaman ini hanya untuk admin.</p>
        <Button variant="outline" onClick={() => navigate('/')}>Kembali</Button>
      </div>
    );
  }

  const getLicenseBadge = (license?: UserLicense) => {
    if (!license) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">No License</span>;
    const expired = license.expires_at && new Date(license.expires_at) < new Date();
    if (expired) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">Expired</span>;
    if (license.license_type === 'lifetime') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">Lifetime</span>;
    if (license.license_type === 'monthly') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/20 text-secondary">Monthly</span>;
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground">Trial</span>;
  };

  return (
    <div className="pb-24 min-h-screen px-4 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl glass">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground font-heading">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">Kelola aplikasi & pengguna</p>
        </div>
      </motion.div>

      <Tabs defaultValue="codes" className="w-full">
        <TabsList className="w-full glass mb-4">
          <TabsTrigger value="codes" className="flex-1 text-xs gap-1"><Key className="h-3.5 w-3.5" />Kode</TabsTrigger>
          <TabsTrigger value="users" className="flex-1 text-xs gap-1"><Users className="h-3.5 w-3.5" />Pengguna</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 text-xs gap-1"><Settings className="h-3.5 w-3.5" />Pengaturan</TabsTrigger>
        </TabsList>

        {/* ── Tab: Activation Codes ── */}
        <TabsContent value="codes">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Generate form */}
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Buat Kode Baru</h2>
              <div>
                <Label className="text-xs">Tipe Lisensi</Label>
                <Select value={licenseType} onValueChange={setLicenseType}>
                  <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Bulanan (30 hari)</SelectItem>
                    <SelectItem value="lifetime">Selamanya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Jumlah</Label>
                <Input type="number" min={1} max={50} value={qty} onChange={e => setQty(Number(e.target.value))} className="h-10 mt-1" />
              </div>
              <Button onClick={handleGenerate} disabled={generating} className="w-full h-10 gradient-primary text-sm">
                {generating ? 'Generating...' : `Generate ${qty} Kode`}
              </Button>
            </div>

            {/* Unused codes */}
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-2">Belum Digunakan ({unusedCodes.length})</h3>
              <div className="space-y-2">
                {unusedCodes.map(c => (
                  <div key={c.id} className="glass-card rounded-xl p-3 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono font-bold text-foreground tracking-wider">{c.code}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.license_type === 'lifetime' ? 'Selamanya' : 'Bulanan'} · {new Date(c.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <button onClick={() => handleCopy(c.code)} className="p-2 rounded-lg glass">
                      {copied === c.code ? <Check className="h-3.5 w-3.5 text-secondary" /> : <Copy className="h-3.5 w-3.5 text-foreground" />}
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                ))}
                {unusedCodes.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">Belum ada kode</p>}
              </div>
            </div>

            {/* Used codes */}
            {usedCodes.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-foreground mb-2">Sudah Digunakan ({usedCodes.length})</h3>
                <div className="space-y-2">
                  {usedCodes.map(c => (
                    <div key={c.id} className="glass rounded-xl p-3 flex items-center gap-2 opacity-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono font-bold text-foreground tracking-wider line-through">{c.code}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Digunakan {c.used_at ? new Date(c.used_at).toLocaleDateString('id-ID') : '-'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* ── Tab: Users ── */}
        <TabsContent value="users">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau nomor..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="h-10 pl-9"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchUsers} className="h-10 w-10">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="glass-card rounded-2xl p-3">
              <p className="text-xs text-muted-foreground mb-2">Total: {users.length} pengguna</p>
              {loadingUsers ? (
                <GlassSkeletonLoader />
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="glass rounded-xl p-3 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{u.name || 'Tanpa Nama'}</p>
                        <p className="text-[10px] text-muted-foreground">{u.phone}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Bergabung {new Date(u.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      {getLicenseBadge(u.license)}
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-4">Tidak ada pengguna ditemukan</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>

        {/* ── Tab: Settings ── */}
        <TabsContent value="settings">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Maintenance */}
            <div className="glass-card rounded-2xl p-4 space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Mode Pemeliharaan</h2>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Aktifkan Maintenance Mode</Label>
                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
              </div>
              <div>
                <Label className="text-xs">Pesan Maintenance</Label>
                <Input
                  value={maintenanceMsg}
                  onChange={e => setMaintenanceMsg(e.target.value)}
                  className="h-10 mt-1"
                  placeholder="Pesan untuk pengguna..."
                />
              </div>
            </div>

            {/* Version */}
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Versi Aplikasi</h2>
              <div>
                <Label className="text-xs">Versi Terbaru</Label>
                <Input
                  value={latestVersion}
                  onChange={e => setLatestVersion(e.target.value)}
                  className="h-10 mt-1"
                  placeholder="contoh: 2.1.0"
                />
              </div>
            </div>

            <Button onClick={saveSettings} disabled={savingSettings} className="w-full h-10 gradient-primary text-sm">
              {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
