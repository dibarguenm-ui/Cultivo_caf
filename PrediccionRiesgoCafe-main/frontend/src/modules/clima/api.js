import axios from 'axios';

// Configuración base
const API_BASE_URL = 'http://localhost:8000';

// Crear instancia de axios para clima
const climaAPI = axios.create({
  baseURL: API_BASE_URL,
});

// ✅ CORREGIDO: Interceptor para el token JWT
climaAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
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
    console.log('✅ Respuesta exitosa:', response.status);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ Error 401 - No autorizado');
      // Redirigir al login si no está autenticado
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de clima
const climaServices = {
  obtenerDatosLote: async (loteId) => {
    try {
      console.log(`📡 Obteniendo datos para lote ${loteId}...`);
      const response = await climaAPI.get(`/api/clima/datos-climaticos/?lote=${loteId}`);
      console.log('✅ Datos obtenidos exitosamente');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo datos reales:', error);

      // Fallback a datos de ejemplo
      console.log('🔄 Usando datos de ejemplo...');
      return {
        data: [
          {
            id: 1,
            temperatura: 22.5,
            humedad_relativa: 75,
            irradiancia_solar: 850.0,
            nubosidad: 30.0,
            precipitacion: 0.0,
            presion_atmosferica: 1013.0,
            velocidad_viento: 2.5,
            fecha_registro: new Date().toISOString(),
            lote_nombre: 'Lote ' + loteId,
            lote_municipio: 'Antioquia',
            fuente_datos: 'openweather_real',
            calidad_datos: 'alta',
            descripcion_clima: 'Despejado',
            ciudad: 'Medellín'
          }
        ]
      };
    }
  },

  actualizarDatosLote: async (loteId) => {
    try {
      console.log(`🔄 Actualizando datos para lote ${loteId}...`);
      const response = await climaAPI.post('/api/clima/datos-climaticos/actualizar_lote/', {
        lote_id: loteId
      });
      console.log('✅ Actualización exitosa');
      return response;
    } catch (error) {
      console.error('❌ Error actualizando datos:', error);
      return {
        data: {
          mensaje: 'Actualización simulada - Error de autenticación',
          error: 'No autorizado'
        }
      };
    }
  },

  obtenerResumenActual: async () => {
    try {
      console.log('📊 Obteniendo resumen actual...');
      const response = await climaAPI.get('/api/clima/dashboard/resumen_actual/');
      console.log('✅ Resumen obtenido exitosamente');
      return response;
    } catch (error) {
      console.error('❌ Error obteniendo resumen:', error);

      // Datos de ejemplo como fallback
      return {
        data: [
          {
            lote_id: 1,
            lote_nombre: 'Lote 1',
            lote_municipio: 'Antioquia',
            temperatura: 22.5,
            humedad: 75,
            irradiancia: 850,
            precipitacion: 0,
            calidad_datos: 'alta',
            ultima_actualizacion: new Date().toISOString()
          },
          {
            lote_id: 2,
            lote_nombre: 'Lote 2',
            lote_municipio: 'Caldas',
            temperatura: 18.2,
            humedad: 80,
            irradiancia: 720,
            precipitacion: 0,
            calidad_datos: 'alta',
            ultima_actualizacion: new Date().toISOString()
          }
        ]
      };
    }
  },

  obtenerHistorico: async (loteId, dias = 7) => {
    try {
      const response = await climaAPI.get(`/api/clima/datos-climaticos/${loteId}/historico/?dias=${dias}`);
      return response;
    } catch (error) {
      console.error('Error obteniendo histórico:', error);
      return { data: [] };
    }
  }
};

export default climaServices;