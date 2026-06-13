import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import GearListPage from './pages/GearListPage';
import GearDetailPage from './pages/GearDetailPage';
import GearFormPage from './pages/GearFormPage';
import AdminEquipmentsPage from './pages/AdminEquipmentsPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminStatsPage from './pages/AdminStatsPage';
import MyOrdersPage from './pages/MyOrdersPage';
import ProfilePage from './pages/ProfilePage';
import { ReactNode } from 'react';

function ProtectedRoute({ children, role }: { children: ReactNode; role?: 'admin' | 'user' }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container"><div className="empty-state"><p>加载中...</p></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return <>{children}</>;
}

function AppLayout() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><GearListPage /></ProtectedRoute>} />
        <Route path="/gear/:id" element={<ProtectedRoute><GearDetailPage /></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute role="user"><MyOrdersPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/admin/equipments" element={<ProtectedRoute role="admin"><AdminEquipmentsPage /></ProtectedRoute>} />
        <Route path="/admin/equipments/new" element={<ProtectedRoute role="admin"><GearFormPage /></ProtectedRoute>} />
        <Route path="/admin/equipments/edit/:id" element={<ProtectedRoute role="admin"><GearFormWrapper /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute role="admin"><AdminOrdersPage /></ProtectedRoute>} />
        <Route path="/admin/stats" element={<ProtectedRoute role="admin"><AdminStatsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function GearFormWrapper() {
  const { id } = useParams<{ id: string }>();
  return <GearFormPage editId={id ? Number(id) : undefined} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
