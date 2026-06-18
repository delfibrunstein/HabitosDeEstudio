import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Adjunta el JWT en cada petición si existe
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const registrarEstudiante = (data) =>
  api.post('/auth/registro', data).then(r => r.data);   // { ok, estudiante, token }

export const loginEstudiante = (data) =>
  api.post('/auth/login', data).then(r => r.data);      // { ok, estudiante, token }

export const cambiarPassword = (data) =>
  api.post('/auth/cambiar-password', data).then(r => r.data);

// ── Carreras ──────────────────────────────────────────────────────────────────
export const getCarreras = () =>
  api.get('/estudiantes/carreras').then(r => r.data.carreras);

// ── Estudiantes ───────────────────────────────────────────────────────────────
export const crearEstudiante      = (data)     => api.post('/estudiantes', data).then(r => r.data.estudiante);
export const actualizarEstudiante = (id, data) => api.put(`/estudiantes/${id}`, data).then(r => r.data.estudiante);
export const getEstudiante        = (id)       => api.get(`/estudiantes/${id}`).then(r => r.data.estudiante);

// Login legacy (mantener por compatibilidad, pero no recomendado)
export const loginPorLegajo = (legajo) =>
  api.get(`/estudiantes/login/${legajo}`).then(r => r.data.estudiante);

// ── Disponibilidad ────────────────────────────────────────────────────────────
export const guardarDisponibilidad = (id, disponibilidad) =>
  api.post(`/estudiantes/${id}/disponibilidad`, { disponibilidad }).then(r => r.data);
export const getDisponibilidad     = (id) =>
  api.get(`/estudiantes/${id}/disponibilidad`).then(r => r.data.disponibilidad);

// ── Materias del estudiante ───────────────────────────────────────────────────
export const getMateriasPorCarrera     = (carreraId) =>
  api.get(`/materias?carreraId=${carreraId}`).then(r => r.data.materias);
export const getMateriasEstudiante     = (id) =>
  api.get(`/estudiantes/${id}/materias`).then(r => r.data.materias);
export const guardarMateriasEstudiante = (id, materias) =>
  api.post(`/estudiantes/${id}/materias`, { materias }).then(r => r.data);

// ── Excel ─────────────────────────────────────────────────────────────────────
export const subirExcel = (archivo, carreraId) => {
  const form = new FormData();
  form.append('archivo', archivo);
  form.append('carreraId', carreraId);
  const token = localStorage.getItem('authToken');
  return axios.post('/api/planes/upload', form, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }).then(r => r.data);
};

// ── Recomendaciones ───────────────────────────────────────────────────────────
export const generarRecomendacion = (estudianteId) =>
  api.post('/recomendaciones/generar', { estudianteId }).then(r => r.data.plan);
export const getRecomendacion     = (id) =>
  api.get(`/recomendaciones/${id}`).then(r => r.data.plan);

// ── IA ────────────────────────────────────────────────────────────────────────
export const explicarIA = (planId) =>
  api.post('/ia/explicar', { planId }).then(r => r.data);
