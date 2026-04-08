import { useState, useRef } from 'react';
import { ArrowLeft, Plus, Search, Edit2, Trash2, ScanLine, Package, Download, Upload, Camera, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProducts, Product } from '@/hooks/useProducts';
import { formatRupiah } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import BarcodeScanner from '@/components/BarcodeScanner';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { resizeImage } from '@/lib/imageResize';

const CATEGORIES = ['Pulsa', 'Aksesoris HP', 'ATK', 'Makanan', 'Minuman', 'Rokok', 'Token Listrik', 'Lainnya'];

function generateBarcode(): string {
  let code = '';
  for (let i = 0; i < 12; i++) code += Math.floor(Math.random() * 10).toString();
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  code += ((10 - (sum % 10)) % 10).toString();
  return code;
}

interface ProductFormData {
  name: string;
  category: string;
  buy_price: number;
  sell_price: number;
  stock: number;
  min_stock: number;
  barcode: string;
  photo_url: string;
}

const emptyForm: ProductFormData = {
  name: '', category: 'Lainnya', buy_price: 0, sell_price: 0, stock: 0, min_stock: 5, barcode: '', photo_url: '',
};

export default function ManajemenProduk() {
  const navigate = useNavigate();
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('Semua');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanContext, setScanContext] = useState<'form' | 'search'>('search');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // ---- Photo handling ----
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Pilih file gambar');
      return;
    }
    setPhotoFile(file);
    // Create preview from original
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const uploadPhoto = async (): Promise<string> => {
    if (!photoFile) return form.photo_url;
    setUploading(true);
    try {
      const resized = await resizeImage(photoFile, 480, 480, 0.7);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('product-photos')
        .upload(fileName, resized, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('product-photos').getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Gagal upload gambar');
      return form.photo_url;
    } finally {
      setUploading(false);
    }
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setForm(f => ({ ...f, photo_url: '' }));
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  // ---- Export CSV ----
  const handleExportCSV = () => {
    if (products.length === 0) { toast.error('Tidak ada produk'); return; }
    const headers = ['Nama', 'Kategori', 'Harga Beli', 'Harga Jual', 'Stok', 'Stok Minimum', 'Barcode'];
    const rows = products.map(p => [p.name, p.category, p.buy_price, p.sell_price, p.stock, p.min_stock, p.barcode]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `produk-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('File CSV berhasil diunduh');
  };

  // ---- Import CSV ----
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { toast.error('File kosong atau format salah'); return; }
      
      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length < 6) continue;
        const [name, category, buyPrice, sellPrice, stock, minStock, barcode] = cols;
        if (!name) continue;
        await addProduct({
          name,
          category: category || 'Lainnya',
          buy_price: Number(buyPrice) || 0,
          sell_price: Number(sellPrice) || 0,
          stock: Number(stock) || 0,
          min_stock: Number(minStock) || 5,
          barcode: barcode || generateBarcode(),
          photo_url: '',
        });
        imported++;
      }
      toast.success(`${imported} produk berhasil diimpor`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    const matchCat = filterCat === 'Semua' || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm, barcode: generateBarcode() });
    setPhotoPreview(null);
    setPhotoFile(null);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({ name: p.name, category: p.category, buy_price: p.buy_price, sell_price: p.sell_price, stock: p.stock, min_stock: p.min_stock, barcode: p.barcode, photo_url: p.photo_url });
    setPhotoPreview(p.photo_url || null);
    setPhotoFile(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nama produk wajib diisi'); return; }
    
    // Upload photo if new file selected
    let photoUrl = form.photo_url;
    if (photoFile) {
      photoUrl = await uploadPhoto();
    }
    
    const productData = { ...form, photo_url: photoUrl };
    
    if (editId) {
      await updateProduct(editId, productData);
      toast.success('Produk diperbarui');
    } else {
      await addProduct(productData);
      toast.success('Produk ditambahkan');
    }
    setDialogOpen(false);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProduct(deleteId);
      toast.success('Produk dihapus');
      setDeleteId(null);
    }
  };

  const handleBarcodeScan = (code: string) => {
    if (scanContext === 'form') {
      setForm(f => ({ ...f, barcode: code }));
      setScanning(false);
    } else {
      setSearch(code);
      setScanning(false);
    }
  };

  if (loading) return null;

  return (
    <div className="pb-20 min-h-screen px-5 pt-6">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/toko')} className="p-2 rounded-xl bg-muted">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Manajemen Produk</h1>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari nama/barcode..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-sm" />
        </div>
        <Button variant="outline" size="icon" onClick={() => { setScanContext('search'); setScanning(true); }}>
          <ScanLine className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['Semua', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterCat === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <Button onClick={openAdd} className="flex-1 gap-2">
          <Plus className="h-4 w-4" /> Tambah
        </Button>
        <Button variant="outline" onClick={handleExportCSV} className="gap-1">
          <Download className="h-4 w-4" /> Export
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-1">
          <Upload className="h-4 w-4" /> Import
        </Button>
        <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleImportCSV} className="hidden" />
      </div>

      {/* Product List */}
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Belum ada produk</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className="bg-card rounded-xl p-3 shadow-card flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <Package className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.category} • Stok: {p.stock}</p>
                <p className="text-xs font-bold text-secondary">{formatRupiah(p.sell_price)}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(p.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Photo Upload */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Foto Produk</label>
              <div className="flex items-center gap-3">
                <div className="relative w-20 h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border shrink-0">
                  {photoPreview ? (
                    <>
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={clearPhoto}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                    {photoPreview ? 'Ganti Foto' : 'Pilih dari Galeri'}
                  </Button>
                  <p className="text-[10px] text-muted-foreground">
                    Otomatis dikecilkan maks 480×480px
                  </p>
                </div>
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Nama Produk *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Kategori</label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground">Harga Beli</label>
                <Input type="number" value={form.buy_price || ''} onChange={e => setForm(f => ({ ...f, buy_price: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Harga Jual</label>
                <Input type="number" value={form.sell_price || ''} onChange={e => setForm(f => ({ ...f, sell_price: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground">Stok</label>
                <Input type="number" value={form.stock || ''} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Stok Minimum</label>
                <Input type="number" value={form.min_stock || ''} onChange={e => setForm(f => ({ ...f, min_stock: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Barcode</label>
              <div className="flex gap-2">
                <Input value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} className="flex-1" />
                <Button variant="outline" size="icon" onClick={() => { setScanContext('form'); setScanning(true); }}>
                  <ScanLine className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, barcode: generateBarcode() }))}>
                  Generate
                </Button>
              </div>
            </div>
            <Button onClick={handleSave} disabled={uploading} className="w-full">
              {uploading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Mengupload...</>
              ) : editId ? 'Simpan Perubahan' : 'Tambah Produk'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>Data produk akan dihapus permanen.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Barcode Scanner */}
      {scanning && <BarcodeScanner onDetected={handleBarcodeScan} onClose={() => setScanning(false)} />}
    </div>
  );
}