import { useState, useEffect } from 'react';
import { ArrowLeft, Store } from 'lucide-react';
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
    <div className="pb-20 min-h-screen px-5 pt-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
          <Store className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Profil Toko</h1>
          <p className="text-sm text-muted-foreground">Atur informasi toko Anda</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Nama Toko</label>
          <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama toko/konter" className="h-12" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Alamat</label>
          <Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Alamat lengkap" className="h-12" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">No. HP Toko</label>
          <Input type="tel" value={form.noHp} onChange={(e) => setForm({ ...form, noHp: e.target.value })} placeholder="08xxxxxxxxxx" className="h-12" maxLength={15} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Keterangan</label>
          <Input value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} placeholder="Info tambahan (opsional)" className="h-12" />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full h-12 gradient-primary shadow-button">
          {saving ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </div>
  );
}
