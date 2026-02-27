import { ArrowLeft, MessageCircle, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const faqs = [
  { q: 'Bagaimana cara membuat transaksi?', a: 'Buka menu Transaksi, pilih jenis (Tarik/Setor/Transfer), isi data pelanggan dan nominal, lalu klik Proses.' },
  { q: 'Bagaimana cara mengubah PIN?', a: 'Buka Profil → Keamanan & PIN, masukkan PIN lama dan PIN baru.' },
  { q: 'Bagaimana cara melihat laporan?', a: 'Buka menu Laporan untuk melihat rekap transaksi dan buku kas harian/mingguan/bulanan.' },
  { q: 'Bagaimana cara reset data?', a: 'Buka Profil → Reset Data. Pilih jenis data yang ingin direset.' },
];

export default function Bantuan() {
  const navigate = useNavigate();
  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>
      <h1 className="text-lg font-bold text-foreground mb-4">Pusat Bantuan</h1>

      <div className="space-y-3 mb-6">
        {faqs.map((faq, i) => (
          <details key={i} className="bg-card rounded-xl p-4 shadow-card group">
            <summary className="text-sm font-medium text-foreground cursor-pointer list-none flex items-center justify-between">
              {faq.q}
              <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <p className="text-sm text-muted-foreground mt-2">{faq.a}</p>
          </details>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">Hubungi Kami</h2>
      <div className="space-y-2">
        {[
          { icon: MessageCircle, label: 'WhatsApp', value: '0812-xxxx-xxxx', href: 'https://wa.me/62812xxxxxxxx' },
          { icon: Mail, label: 'Email', value: 'support@bukuagen.app', href: 'mailto:support@bukuagen.app' },
        ].map((c) => (
          <a key={c.label} href={c.href} target="_blank" rel="noopener" className="bg-card rounded-xl p-4 flex items-center gap-3 shadow-card">
            <c.icon className="h-5 w-5 text-secondary" />
            <div>
              <p className="text-sm font-medium text-foreground">{c.label}</p>
              <p className="text-xs text-muted-foreground">{c.value}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
