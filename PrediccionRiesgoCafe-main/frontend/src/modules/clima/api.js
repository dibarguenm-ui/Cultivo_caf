import axios from 'axios';

// Configuración base
const API_BASE_URL = 'http://localhost:8000';

// Crear instancia de axios para clima
const climaAPI = axios.create({
  baseURL: API_BASE_URL,
});

// ✅ CORREGIDO: Interceptor para el token JWT
climaAPI.interceptors.request.use((config) => {
  // Intentar tanto accessToken como access_token
  const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
  console.log('🔐 Token encontrado:', token ? 'Sí' : 'No');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('✅ Token agregado a headers');
  } else {
    console.warn('⚠️ No hay token disponible');
  }
  return config;
}, (error) => {
  console.error('❌ Error en interceptor:', error);
  return Promise.reject(error);
});

// ✅ CORREGIDO: Manejar errores de autenticación
climaAPI.interceptors.response.use(
  (response) => {
    console.log('✅ Respuesta exitosa - Status:', response.status);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ Error 401 - No autorizado');
      // Redirigir al login si no está autenticado
      localStorage.removeItem('accessToken');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    // Retornar el error para que se maneje en el catch
    return Promise.reject(error);
  }
);

// Servicios de clima
const climaServices = {
  obtenerLotesUsuario: async () => {
    try {
      console.log('� Obteniendo lotes del usuario...');
      const response = await climaAPI.get('/api/cultivos/lotes/');
      console.log('✅ Lotes obtenidos exitosamente:', response.data);
      
      if (!response.data || response.data.length === 0) {
        throw new Error('El usuario no tiene lotes registrados');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo lotes:', error.message);
      throw error;
    }
  },

  obtenerDatosLote: async (loteId) => {
    try {
      console.log(`🔍 Obteniendo datos para lote ${loteId}...`);
      // Agregar timestamp al query para forzar que no cachee
      const timestamp = new Date().getTime();
      const response = await climaAPI.get(`/api/clima/datos-climaticos/?lote=${loteId}&t=${timestamp}`);
      console.log('✅ Datos obtenidos exitosamente:', response.data);
      console.log(`📊 Total registros: ${response.data.length}`);
      if (response.data.length > 0) {
        const primero = response.data[0];
        console.log(`   Más reciente: ID=${primero.id}, Temp=${primero.temperatura}°C, Irradiancia=${primero.irradiancia_solar}W/m²`);
      }
      
      // Retornar la respuesta tal cual, incluso si está vacía
      // El componente frontend manejará el caso de vacío
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo datos:', error.message);
      throw error;
    }
  },

  actualizarDatosLote: async (loteId) => {
    try {
      console.log(`🔄 Actualizando datos para lote ${loteId}...`);
      const response = await climaAPI.post('/api/clima/datos-climaticos/actualizar_lote/', {
        lote_id: loteId
      });
      console.log('✅ Actualización exitosa:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error actualizando datos:', error.message);
      throw error;
    }
  },

  obtenerResumenActual: async () => {
    try {
      console.log('📊 Obteniendo resumen actual de lotes...');
      // Intentar endpoint del viewset
      const response = await climaAPI.get('/api/clima/datos-climaticos/ultimos_datos/');
      console.log('✅ Resumen obtenido exitosamente:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo resumen:', error.message);
      throw error;
    }
  },

  obtenerHistorico: async (loteId, dias = 7) => {
    try {
      console.log(`📊 Obteniendo histórico de ${dias} días para lote ${loteId}...`);
      const response = await climaAPI.get(`/api/clima/datos-climaticos/?lote=${loteId}&dias=${dias}`);
      console.log('✅ Histórico obtenido:', response.data);
      return response;
    } catch (error) {
      console.error('Error obteniendo histórico:', error.message);
      throw error;
    }
  },

  obtenerHistoricoLote: async (loteId, dias = 7) => {
    try {
      console.log(`📊 Obteniendo histórico de mediciones para lote ${loteId} - últimos ${dias} días...`);
      // Usar el endpoint de histórico del viewset
      // Agregar timestamp para forzar que no cachee
      const timestamp = new Date().getTime();
      const response = await climaAPI.get(`/api/clima/datos-climaticos/${loteId}/historico/?dias=${dias}&t=${timestamp}`);
      console.log('✅ Histórico de mediciones obtenido:', response.data);
      return response;
    } catch (error) {
      // Si falla el endpoint de histórico, intentar obtener todos los datos del lote
      console.warn('⚠️ Error en endpoint historico, intentando endpoint alternativo...');
      try {
        const response = await climaAPI.get(`/api/clima/datos-climaticos/?lote=${loteId}`);
        console.log('✅ Datos obtenidos (alternativo):', response.data);
        return response;
      } catch (altError) {
        console.error('❌ Error obteniendo histórico:', altError.message);
        throw altError;
      }
    }
  }
};

export default climaServices;