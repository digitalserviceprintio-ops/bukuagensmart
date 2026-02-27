import { useState, useEffect } from 'react';
import { ArrowLeft, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface TokoProfile {
  nama: string;
  alamat: string;
  noHp: string;
  keterangan: string;
}

export default function AturProfilToko() {
  const navigate = useNavigate();
  const stored = localStorage.getItem('toko_profile');
  const [profile, setProfile] = useState<TokoProfile>(stored ? JSON.parse(stored) : { nama: '', alamat: '', noHp: '', keterangan: '' });

  const handleSave = () => {
    localStorage.setItem('toko_profile', JSON.stringify(profile));
    toast({ title: 'Profil toko berhasil disimpan' });
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
          <Input value={profile.nama} onChange={(e) => setProfile({ ...profile, nama: e.target.value })} placeholder="Nama toko/konter" className="h-12" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Alamat</label>
          <Input value={profile.alamat} onChange={(e) => setProfile({ ...profile, alamat: e.target.value })} placeholder="Alamat lengkap" className="h-12" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">No. HP Toko</label>
          <Input type="tel" value={profile.noHp} onChange={(e) => setProfile({ ...profile, noHp: e.target.value })} placeholder="08xxxxxxxxxx" className="h-12" maxLength={15} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Keterangan</label>
          <Input value={profile.keterangan} onChange={(e) => setProfile({ ...profile, keterangan: e.target.value })} placeholder="Info tambahan (opsional)" className="h-12" />
        </div>
        <Button onClick={handleSave} className="w-full h-12 gradient-primary shadow-button">Simpan</Button>
      </div>
    </div>
  );
}
