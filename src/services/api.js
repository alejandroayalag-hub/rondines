import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://seguridadgrupoata.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor: adjunta el token JWT en cada petición ──
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return config;
});

// ── Auth ────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
};

// ── Escaneos ────────────────────────────────────────────
export const escaneosAPI = {
  registrar: (datos) =>
    api.post('/escaneos', datos),

  getMisEscaneos: () =>
    api.get('/escaneos/mis-escaneos'),
};

// ── Turnos ──────────────────────────────────────────────
export const turnosAPI = {
  iniciar: () =>
    api.post('/turnos/iniciar'),

  terminar: () =>
    api.put('/turnos/terminar'),

  getActivo: () =>
    api.get('/turnos/activo'),
};

// ── Alertas ─────────────────────────────────────────────
export const alertasAPI = {
  getAlertas: () =>
    api.get('/alertas'),

  enviarSOS: (datos) =>
    api.post('/alertas/sos', datos),
};

// ── Push ────────────────────────────────────────────────
export const pushAPI = {
  registrar: (token, plataforma) =>
    api.post('/push/registrar', { token, plataforma }),

  remover: (token) =>
    api.delete('/push/remover', { data: { token } }),
};

export default api;
