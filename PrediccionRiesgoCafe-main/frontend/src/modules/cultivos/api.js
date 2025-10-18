import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/';

// Función para obtener el token
const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

// Endpoints completos para lotes
export const getLotes = (token) => axios.get(`${API_URL}cultivos/lotes/`, {
  headers: { Authorization: `Bearer ${token}` }
});

export const getMisLotes = (token) => axios.get(`${API_URL}cultivos/mis-lotes/`, {
  headers: { Authorization: `Bearer ${token}` }
});

export const getLote = (id, token) => axios.get(`${API_URL}cultivos/lotes/${id}/`, {
  headers: { Authorization: `Bearer ${token}` }
});

export const createLote = (loteData, token) => axios.post(`${API_URL}cultivos/lotes/`, loteData, {
  headers: { Authorization: `Bearer ${token}` }
});

export const updateLote = (id, loteData, token) => axios.put(`${API_URL}cultivos/lotes/${id}/`, loteData, {
  headers: { Authorization: `Bearer ${token}` }
});

export const deleteLote = (id, token) => axios.delete(`${API_URL}cultivos/lotes/${id}/`, {
  headers: { Authorization: `Bearer ${token}` }
});

export const getEstadisticas = (token) => axios.get(`${API_URL}cultivos/estadisticas/`, {
  headers: { Authorization: `Bearer ${token}` }
});

// ✨ NUEVOS ENDPOINTS PARA UMBRALES DE RADIACIÓN
export const getUmbralesRadiacion = (token) => axios.get(`${API_URL}cultivos/umbrales-radiacion/`, {
  headers: { Authorization: `Bearer ${token}` }
});

export const getUmbralPorVariedad = (variedad, token) => axios.get(
  `${API_URL}cultivos/umbrales-radiacion/por_variedad/?variedad=${variedad}`,
  { headers: { Authorization: `Bearer ${token}` } }
);

export const getTodasVariedades = (token) => axios.get(`${API_URL}cultivos/umbrales-radiacion/todas_variedades/`, {
  headers: { Authorization: `Bearer ${token}` }
});

// Datos para formularios
export const formularioData = {
  departamentos: [
    'Antioquia', 'Caldas', 'Risaralda', 'Quindío', 'Valle del Cauca',
    'Cundinamarca', 'Huila', 'Tolima', 'Cauca', 'Nariño', 'Santander', 'Boyacá', 'Otro'
  ],
  variedades: [
    'Caturra', 'Castillo', 'Bourbon', 'Típica', 'Maragogipe', 'Tabí', 'Geisha', 'Otro'
  ],
  nivelesSombra: [
    'Alto', 'Medio', 'Bajo'
  ]
};