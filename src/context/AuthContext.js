import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';
import { registrarPushToken, removerPushToken } from '../services/pushSetup';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => { cargarSesion(); }, []);

  const cargarSesion = async () => {
    try {
      const usuarioGuardado = await SecureStore.getItemAsync('usuario');
      const token = await SecureStore.getItemAsync('auth_token');
      if (usuarioGuardado && token) {
        setUsuario(JSON.parse(usuarioGuardado));
        registrarPushToken().catch(() => {});
      }
    } catch (e) {
      console.log('Sin sesion guardada');
    } finally {
      setCargando(false);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login(email, password);
    const { token, usuario } = response.data;
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('usuario', JSON.stringify(usuario));
    setUsuario(usuario);
    registrarPushToken().catch((err) => console.log('Push token no registrado:', err.message));
    return usuario;
  };

  const logout = async () => {
    try { await removerPushToken(); } catch (_) {}
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('usuario');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
