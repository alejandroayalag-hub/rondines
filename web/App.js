import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Mapa from './pages/Mapa';
import Alertas from './pages/Alertas';
import Reportes from './pages/Reportes';
import Puntos from './pages/Puntos';
import './index.css';

function PrivateRoute({ children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)', letterSpacing: 3 }}>
      CARGANDO...
    </div>
  );
  return usuario ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return null;
  return usuario ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            <PublicRoute><Login /></PublicRoute>
          } />
          <Route path="/" element={
            <PrivateRoute><Layout /></PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="mapa" element={<Mapa />} />
            <Route path="alertas" element={<Alertas />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="puntos" element={<Puntos />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
