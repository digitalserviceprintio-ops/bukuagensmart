import { useState } from 'react';
import { FileText, Share2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/data/mockData';
import jsPDF from 'jspdf';

interface ReceiptData {
  id: string;
  type: string;
  amount: number;
  fee: number;
  commission: number;
  customer_name: string;
  customer_phone: string;
  created_at: string;
}

interface TokoInfo {
  nama?: string;
  alamat?: string;
  noHp?: string;
}

export function generateReceiptPDF(tx: ReceiptData, toko?: TokoInfo): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: [80, 180] });
  const w = 80;
  let y = 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(toko?.nama || 'Neo Agen MD2R', w / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  if (toko?.alamat) {
    doc.text(toko.alamat, w / 2, y, { align: 'center' });
    y += 4;
  }
  if (toko?.noHp) {
    doc.text(`HP: ${toko.noHp}`, w / 2, y, { align: 'center' });
    y += 4;
  }
  doc.text('Struk Transaksi Digital', w / 2, y, { align: 'center' });
  y += 6;

  doc.setDrawColor(180);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(4, y, w - 4, y);
  y += 5;

  const typeLabels: Record<string, string> = { tarik: 'Tarik Tunai', setor: 'Setor Tunai', transfer: 'Transfer' };
  const rows = [
    ['Jenis', typeLabels[tx.type] || tx.type],
    ['Tanggal', new Date(tx.created_at).toLocaleString('id-ID')],
    ['Pelanggan', tx.customer_name],
    ['No. HP', tx.customer_phone || '-'],
    ['Nominal', formatRupiah(tx.amount)],
    ['Biaya Admin', formatRupiah(tx.fee)],
    ['Total', formatRupiah(tx.amount + tx.fee)],
    ['ID Transaksi', tx.id.slice(0, 8).toUpperCase()],
  ];

  doc.setFontSize(7);
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.text(label, 6, y);
    doc.setFont('helvetica', 'bold');
    doc.text(value, w - 6, y, { align: 'right' });
    y += 5;
  });

  y += 2;
  doc.line(4, y, w - 4, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('Terima kasih telah bertransaksi.', w / 2, y, { align: 'center' });
  y += 4;
  doc.text('Struk ini adalah bukti transaksi yang sah.', w / 2, y, { align: 'center' });

  return doc;
}

export default function ReceiptButton({ tx, toko }: { tx: ReceiptData; toko?: TokoInfo }) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = () => {
    setGenerating(true);
    try {
      const doc = generateReceiptPDF(tx, toko);
      doc.save(`struk-${tx.id.slice(0, 8)}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  const handleShareWhatsApp = () => {
    const typeLabels: Record<string, string> = { tarik: 'Tarik Tunai', setor: 'Setor Tunai', transfer: 'Transfer' };
    const header = toko?.nama ? `📄 *STRUK TRANSAKSI - ${toko.nama}*` : `📄 *STRUK TRANSAKSI - Neo Agen MD2R*`;
    const msg = encodeURIComponent(
      `${header}\n\n` +
      `Jenis: ${typeLabels[tx.type] || tx.type}\n` +
      `Pelanggan: ${tx.customer_name}\n` +
      `Nominal: ${formatRupiah(tx.amount)}\n` +
      `Biaya Admin: ${formatRupiah(tx.fee)}\n` +
      `Total: ${formatRupiah(tx.amount + tx.fee)}\n` +
      `Tanggal: ${new Date(tx.created_at).toLocaleString('id-ID')}\n` +
      `ID: ${tx.id.slice(0, 8).toUpperCase()}\n\n` +
      `Terima kasih telah bertransaksi! 🙏`
    );
    const phone = tx.customer_phone?.replace(/\D/g, '');
    const url = phone ? `https://wa.me/62${phone.replace(/^0/, '')}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleDownload} disabled={generating} className="flex items-center gap-1 text-xs">
        <Download className="h-3 w-3" />
        PDF
      </Button>
      <Button variant="outline" size="sm" onClick={handleShareWhatsApp} className="flex items-center gap-1 text-xs text-secondary border-secondary/30">
        <Share2 className="h-3 w-3" />
        WA
      </Button>
    </div>
  );
}
