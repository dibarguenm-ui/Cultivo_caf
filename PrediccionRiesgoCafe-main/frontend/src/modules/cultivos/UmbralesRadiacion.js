import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './UmbralesRadiacion.module.css';

const API_URL = 'http://127.0.0.1:8000/api/';

/**
 * Componente que muestra y valida los umbrales de radiación solar
 * para una variedad de café específica
 */
const UmbralesRadiacion = ({ variedad, radiacionActual = null, token }) => {
  const [umbral, setUmbral] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [riesgoNivel, setRiesgoNivel] = useState(null);

  useEffect(() => {
    if (variedad) {
      cargarUmbral(variedad);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variedad]);

  // Evaluar riesgo cuando cambia la radiación actual
  useEffect(() => {
    if (umbral && radiacionActual) {
      evaluarRiesgo(radiacionActual);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiacionActual, umbral]);

  const cargarUmbral = async (var_) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_URL}cultivos/umbrales-radiacion/por_variedad/?variedad=${var_}`
      );
      setUmbral(response.data);
    } catch (err) {
      console.error('Error cargando umbral:', err);
      setError('No se encontraron umbrales para esta variedad');
    } finally {
      setLoading(false);
    }
  };

  const evaluarRiesgo = (radiacion) => {
    if (!umbral) return;

    if (radiacion < umbral.radiacion_minima) {
      setRiesgoNivel({
        nivel: 'bajo',
        mensaje: 'Radiación muy baja',
        recomendacion: 'Verificar nubosidad o exceso de sombra',
        color: '#2196F3'
      });
    } else if (radiacion < umbral.radiacion_optima) {
      setRiesgoNivel({
        nivel: 'medio',
        mensaje: 'Radiación por debajo de lo óptimo',
        recomendacion: 'Aumentar exposición solar si es posible',
        color: '#FFC107'
      });
    } else if (radiacion <= umbral.radiacion_maxima) {
      setRiesgoNivel({
        nivel: 'optimo',
        mensaje: 'Radiación óptima',
        recomendacion: 'Condiciones ideales para el cultivo',
        color: '#4CAF50'
      });
    } else {
      setRiesgoNivel({
        nivel: 'alto',
        mensaje: 'Radiación excesiva',
        recomendacion: 'Riesgo de quemadura solar - aumentar sombra',
        color: '#FF5722'
      });
    }
  };

  if (loading) {
    return <div className={styles.loading}>🔄 Cargando umbrales...</div>;
  }

  if (error) {
    return <div className={styles.error}>ℹ️ {error}</div>;
  }

  if (!umbral) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>📊 Umbrales de Radiación Solar</h3>
        <p className={styles.subtitle}>{variedad}</p>
      </div>

      <div className={styles.thresholds}>
        <div className={styles.thresholdItem}>
          <div className={styles.label}>Mínima</div>
          <div className={styles.value}>{umbral.radiacion_minima}</div>
          <div className={styles.unit}>W/m²</div>
        </div>

        <div className={styles.thresholdItem}>
          <div className={styles.label}>Óptima</div>
          <div className={`${styles.value} ${styles.optimal}`}>
            {umbral.radiacion_optima}
          </div>
          <div className={styles.unit}>W/m²</div>
        </div>

        <div className={styles.thresholdItem}>
          <div className={styles.label}>Máxima</div>
          <div className={styles.value}>{umbral.radiacion_maxima}</div>
          <div className={styles.unit}>W/m²</div>
        </div>
      </div>

      {radiacionActual !== null && riesgoNivel && (
        <div
          className={`${styles.riskAssessment} ${styles[riesgoNivel.nivel]}`}
          style={{ borderLeftColor: riesgoNivel.color }}
        >
          <div className={styles.riskMessage}>
            <strong>{riesgoNivel.mensaje}</strong>
            <p>Radiación actual: <span>{radiacionActual.toFixed(1)}</span> W/m²</p>
          </div>
          <div className={styles.riskRecommendation}>
            💡 {riesgoNivel.recomendacion}
          </div>
        </div>
      )}

      {umbral.nivel_sombra_recomendado && (
        <div className={styles.recommendation}>
          <h4>🌳 Recomendación de Sombra</h4>
          <p>
            Para la variedad <strong>{variedad}</strong>, se recomienda un nivel de sombra:
            <span className={styles.shadeLevelBadge}>
              {umbral.nivel_sombra_recomendado}
            </span>
          </p>
        </div>
      )}

      {umbral.descripcion && (
        <div className={styles.description}>
          <p>{umbral.descripcion}</p>
        </div>
      )}
    </div>
  );
};

export default UmbralesRadiacion;
