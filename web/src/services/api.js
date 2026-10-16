import axios from 'axios';

const BASE_URL = 'https://seguridadgrupoata.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
};

export const escaneosAPI = {
  listar: (params) => api.get('/escaneos', { params }),
  getMisEscaneos: () => api.get('/escaneos/mis-escaneos'),
};

export const turnosAPI = {
  listar: (params) => api.get('/turnos', { params }),
  getActivo: () => api.get('/turnos/activo'),
  iniciar: () => api.post('/turnos/iniciar'),
  terminar: () => api.put('/turnos/terminar'),
};

export const alertasAPI = {
  listar: (params) => api.get('/alertas', { params }),
  resolver: (id) => api.put(`/alertas/${id}/resolver`),
  enviarSOS: (datos) => api.post('/alertas/sos', datos),
};

export const puntosAPI = {
  listar: () => api.get('/puntos'),
  crear: (datos) => api.post('/puntos', datos),
  actualizar: (id, datos) => api.put(`/puntos/${id}`, datos),
  eliminar: (id) => api.delete(`/puntos/${id}`),
};

export const reportesAPI = {
  resumen: (fecha) => api.get('/reportes/resumen', { params: fecha ? { fecha } : {} }),
  actividadTiempoReal: () => api.get('/reportes/actividad-tiempo-real'),
};

export default api;
