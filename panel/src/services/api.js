import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
};

export const reportesAPI = {
  resumen: () => api.get('/reportes/resumen'),
  actividadTiempoReal: () => api.get('/reportes/actividad-tiempo-real'),
};

export const alertasAPI = {
  listar: (params) => api.get('/alertas', { params }),
  resolver: (id) => api.put(`/alertas/${id}/resolver`),
};

export const usuariosAPI = {
  listar: () => api.get('/usuarios'),
  crear: (data) => api.post('/usuarios', data),
  actualizar: (id, data) => api.put(`/usuarios/${id}`, data),
  cambiarPassword: (id, password) => api.patch(`/usuarios/${id}/password`, { password }),
  toggleActivo: (id) => api.patch(`/usuarios/${id}/toggle`),
  eliminar: (id) => api.delete(`/usuarios/${id}`),
};

export const puntosAPI = {
  listar: (todos = false) => api.get('/puntos', { params: todos ? { todos: 1 } : {} }),
  crear: (data) => api.post('/puntos', data),
  actualizar: (id, data) => api.put(`/puntos/${id}`, data),
  toggleActivo: (id) => api.patch(`/puntos/${id}/toggle`),
  eliminar: (id) => api.delete(`/puntos/${id}`),
};

export const escaneosAPI = {
  listar: (params) => api.get('/escaneos', { params }),
};

export const turnosAPI = {
  listar: (params) => api.get('/turnos', { params }),
};

export default api;
