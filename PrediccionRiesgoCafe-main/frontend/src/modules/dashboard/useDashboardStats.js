import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../users/AuthContext';
import { getMisLotes } from '../cultivos/api';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Hook personalizado para estadísticas del dashboard
export const useDashboardStats = () => {
  const { accessToken } = useContext(AuthContext);
  const [stats, setStats] = useState([
    { icon: '🌱', label: 'Cultivos Activos', value: '...', color: '#52b788' },
    { icon: '🌤️', label: 'Clima Monitoreado', value: '...', color: '#74c69d' },
    { icon: '🤖', label: 'Predicciones ML', value: '...', color: '#95d5b2' },
    { icon: '⚠️', label: 'Alertas Activas', value: '...', color: '#f4a261' }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;

    const fetchStats = async () => {
      try {
        setLoading(true);

        // 1. Obtener número de cultivos activos
        let cultivosCount = 0;
        try {
          const cultivosResponse = await getMisLotes(accessToken);
          cultivosCount = cultivosResponse.data.length || 0;
        } catch (error) {
          console.warn('Error obteniendo cultivos:', error);
        }

        // 2. Estado del monitoreo climático (siempre activo)
        const climaStatus = '24/7';

        // 3. Obtener número de predicciones ML
        let prediccionesCount = 0;
        try {
          const prediccionesResponse = await axios.get(
            `${API_BASE_URL}/predicciones/predicciones/`,
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          );
          prediccionesCount = prediccionesResponse.data.length || 0;
        } catch (error) {
          console.warn('Error obteniendo predicciones:', error);
        }

        // 4. Obtener número de alertas activas
        let alertasCount = 0;
        try {
          // Aquí puedes agregar la lógica para contar alertas activas
          // Por ahora asumimos que hay endpoint para esto
          const alertasResponse = await axios.get(
            `${API_BASE_URL}/predicciones/alertas/`,
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          );
          // Filtrar solo alertas activas
          alertasCount = alertasResponse.data.filter(alert => alert.activa).length || 0;
        } catch (error) {
          // Si no hay endpoint de alertas, mantener en 0
          console.warn('Error obteniendo alertas (normal si no existe endpoint):', error);
        }

        // Actualizar las estadísticas
        setStats([
          {
            icon: '🌱',
            label: cultivosCount === 1 ? 'Cultivo Activo' : 'Cultivos Activos',
            value: cultivosCount.toString(),
            color: '#52b788'
          },
          {
            icon: '🌤️',
            label: 'Clima Monitoreado',
            value: climaStatus,
            color: '#74c69d'
          },
          {
            icon: '🤖',
            label: prediccionesCount === 1 ? 'Predicción ML' : 'Predicciones ML',
            value: prediccionesCount.toString(),
            color: '#95d5b2'
          },
          {
            icon: '⚠️',
            label: alertasCount === 1 ? 'Alerta Activa' : 'Alertas Activas',
            value: alertasCount.toString(),
            color: alertasCount > 0 ? '#f4a261' : '#52b788'
          }
        ]);

      } catch (error) {
        console.error('Error general obteniendo estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Actualizar estadísticas cada 5 minutos
    const interval = setInterval(fetchStats, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [accessToken]);

  return { stats, loading };
};
