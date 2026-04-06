
## Rencana Implementasi

### 1. Buat tabel `app_settings` di database
- Menyimpan status maintenance (on/off), pesan maintenance, dan versi terbaru aplikasi
- Tabel publik tanpa RLS (semua user perlu baca settingan ini)

### 2. Insert data default
- `maintenance_mode`: false
- `maintenance_message`: "Aplikasi sedang dalam pemeliharaan"
- `latest_version`: "1.0.0"

### 3. Buat hook `useAppSettings`
- Fetch app_settings saat app load
- Cek apakah maintenance mode aktif
- Bandingkan versi lokal vs versi di database

### 4. Buat komponen `MaintenanceDialog`
- Popup fullscreen saat maintenance aktif
- Tidak bisa ditutup (blocking)

### 5. Buat komponen `UpdateNotification`
- Popup saat versi di database lebih baru dari versi lokal
- Tombol "Update Sekarang" yang reload halaman

### 6. Integrasikan di App.tsx
