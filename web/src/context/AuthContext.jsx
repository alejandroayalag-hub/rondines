import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('usuario');
    const token = localStorage.getItem('auth_token');
    if (saved && token) {
      try { setUsuario(JSON.parse(saved)); } catch (_) {}
    }
    setCargando(false);
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const { token, usuario } = res.data;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    setUsuario(usuario);
    return usuario;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
