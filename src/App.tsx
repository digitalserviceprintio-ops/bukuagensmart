import { useState, useCallback } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import SplashScreen from "@/components/SplashScreen";
import MaintenanceDialog from "@/components/MaintenanceDialog";
import UpdateDialog from "@/components/UpdateDialog";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Transaksi from "./pages/Transaksi";
import BukuKas from "./pages/BukuKas";
import Laporan from "./pages/Laporan";
import Profil from "./pages/Profil";
import KeamananPin from "./pages/KeamananPin";
import RiwayatAktivitas from "./pages/RiwayatAktivitas";
import Bantuan from "./pages/Bantuan";
import TentangAplikasi from "./pages/TentangAplikasi";
import AturBiayaAdmin from "./pages/AturBiayaAdmin";
import ResetData from "./pages/ResetData";
import AturProfilToko from "./pages/AturProfilToko";
import Lisensi from "./pages/Lisensi";
import DevActivation from "./pages/DevActivation";
import BottomNav from "./components/BottomNav";
import NotFound from "./pages/NotFound";
import TokoDashboard from "./pages/toko/TokoDashboard";
import ManajemenProduk from "./pages/toko/ManajemenProduk";
import KasirPOS from "./pages/toko/KasirPOS";
import ManajemenStok from "./pages/toko/ManajemenStok";
import LaporanToko from "./pages/toko/LaporanToko";

const queryClient = new QueryClient();

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen relative">
      {children}
      <BottomNav />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [dismissUpdate, setDismissUpdate] = useState(false);
  const handleSplashFinish = useCallback(() => setShowSplash(false), []);
  const appSettings = useAppSettings();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
        <MaintenanceDialog open={appSettings.maintenanceMode} message={appSettings.maintenanceMessage} />
        <UpdateDialog
          open={appSettings.hasUpdate && !dismissUpdate && !appSettings.maintenanceMode && !showSplash}
          latestVersion={appSettings.latestVersion}
          onUpdate={() => window.location.reload()}
          onDismiss={() => setDismissUpdate(true)}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/transaksi" element={<ProtectedRoute><Transaksi /></ProtectedRoute>} />
            <Route path="/buku-kas" element={<ProtectedRoute><BukuKas /></ProtectedRoute>} />
            <Route path="/laporan" element={<ProtectedRoute><Laporan /></ProtectedRoute>} />
            <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
            <Route path="/profil/keamanan" element={<ProtectedRoute><KeamananPin /></ProtectedRoute>} />
            <Route path="/profil/riwayat" element={<ProtectedRoute><RiwayatAktivitas /></ProtectedRoute>} />
            <Route path="/profil/bantuan" element={<ProtectedRoute><Bantuan /></ProtectedRoute>} />
            <Route path="/profil/tentang" element={<ProtectedRoute><TentangAplikasi /></ProtectedRoute>} />
            <Route path="/profil/biaya-admin" element={<ProtectedRoute><AturBiayaAdmin /></ProtectedRoute>} />
            <Route path="/profil/reset" element={<ProtectedRoute><ResetData /></ProtectedRoute>} />
            <Route path="/profil/toko" element={<ProtectedRoute><AturProfilToko /></ProtectedRoute>} />
            <Route path="/profil/lisensi" element={<ProtectedRoute><Lisensi /></ProtectedRoute>} />
            <Route path="/dev/activation" element={<ProtectedRoute><DevActivation /></ProtectedRoute>} />
            <Route path="/toko" element={<ProtectedRoute><TokoDashboard /></ProtectedRoute>} />
            <Route path="/toko/produk" element={<ProtectedRoute><ManajemenProduk /></ProtectedRoute>} />
            <Route path="/toko/kasir" element={<ProtectedRoute><KasirPOS /></ProtectedRoute>} />
            <Route path="/toko/stok" element={<ProtectedRoute><ManajemenStok /></ProtectedRoute>} />
            <Route path="/toko/laporan" element={<ProtectedRoute><LaporanToko /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
