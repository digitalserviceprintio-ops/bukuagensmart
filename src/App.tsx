import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
import BottomNav from "./components/BottomNav";
import NotFound from "./pages/NotFound";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
