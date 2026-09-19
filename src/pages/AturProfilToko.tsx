import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Phone, Save, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useTokoProfile } from '@/hooks/useTokoProfile';

export default function AturProfilToko() {
  const navigate = useNavigate();
  const { profile, loading, save } = useTokoProfile();
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(profile); }, [profile]);

  if (loading) return null;

  const handleSave = async () => {
    setSaving(true);
    const error = await save(form);
    setSaving(false);
    if (error) {
      toast({ title: 'Gagal menyimpan', description: (error as any).message, variant: 'destructive' });
    } else {
      toast({ title: 'Profil toko berhasil disimpan' });
    }
  };

  return (
    <div className="pb-24 min-h-screen bg-background">
      <header className="bg-card border-b border-border px-5 pt-6 pb-5">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-3 mb-4 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
        <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Store className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold text-primary">NEO MINI ATM</p>
          <h1 className="text-xl font-bold text-foreground">Profil Toko</h1>
        </div>
        </div>
      </header>

      <div className="px-5 pt-5">
      <div className="bg-card rounded-lg p-5 border border-border shadow-card space-y-4">
        <div>
          <label className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2"><Store className="h-4 w-4 text-primary" /> Nama Toko</label>
          <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama toko/konter" className="h-12" />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Alamat</label>
          <Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Alamat lengkap" className="h-12" />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> No. HP Toko</label>
          <Input type="tel" value={form.noHp} onChange={(e) => setForm({ ...form, noHp: e.target.value })} placeholder="08xxxxxxxxxx" className="h-12" maxLength={15} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Keterangan</label>
          <Input value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} placeholder="Info tambahan (opsional)" className="h-12" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full h-12 shadow-button">
          <Save className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Simpan Profil'}
        </Button>
      </div>
      </div>
    </div>
  );
}
