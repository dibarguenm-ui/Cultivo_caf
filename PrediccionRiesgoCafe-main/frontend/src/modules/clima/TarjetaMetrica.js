import React from 'react';
import styles from './Clima.module.css';

const TarjetaMetrica = ({ titulo, valor, icono, tendencia, color }) => {
  const esPositivo = tendencia.includes('+');

  return (
    <div className={styles.tarjetaMetrica} style={{ borderLeftColor: color }}>
      <div className={styles.metricaHeader}>
        <span className={styles.icono}>{icono}</span>
        <span className={styles.titulo}>{titulo}</span>
      </div>

      <div className={styles.metricaValor}>
        {valor}
      </div>

      {tendencia && (
        <div className={`${styles.tendencia} ${esPositivo ? styles.positivo : styles.negativo}`}>
          {tendencia}
        </div>
      )}
    </div>
  );
};

export default TarjetaMetrica;