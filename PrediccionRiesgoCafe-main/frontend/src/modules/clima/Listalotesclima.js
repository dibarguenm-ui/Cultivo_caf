import React from 'react';
import styles from './Clima.module.css';

const ListaLotesClima = ({ lotes, loteSeleccionado, onLoteSeleccionado }) => {
  const getColorRiesgo = (temperatura, irradiancia) => {
    if (temperatura > 32 || irradiancia > 1500) return styles.riesgoAlto;
    if (temperatura > 28 || irradiancia > 1200) return styles.riesgoMedio;
    return styles.riesgoBajo;
  };

  return (
    <div className={styles.listaLotes}>
      {lotes.map((lote) => (
        <div
          key={lote.lote_id}
          className={`${styles.loteItem} ${
            loteSeleccionado === lote.lote_id ? styles.seleccionado : ''
          } ${getColorRiesgo(lote.temperatura, lote.irradiancia)}`}
          onClick={() => onLoteSeleccionado(lote.lote_id)}
        >
          <div className={styles.loteInfo}>
            <h4>{lote.lote_nombre}</h4>
            <span className={styles.ubicacion}>{lote.lote_municipio}</span>
          </div>

          <div className={styles.loteDatos}>
            <div className={styles.datoRapido}>
              <span className={styles.etiqueta}>🌡️</span>
              <span className={styles.valor}>{lote.temperatura}°C</span>
            </div>
            <div className={styles.datoRapido}>
              <span className={styles.etiqueta}>💧</span>
              <span className={styles.valor}>{lote.humedad}%</span>
            </div>
          </div>

          <div className={styles.indicadorSeleccion}></div>
        </div>
      ))}

      {lotes.length === 0 && (
        <div className={styles.sinDatos}>
          <p>No hay lotes con datos climáticos</p>
          <span>Los datos se cargarán automáticamente cuando estén disponibles</span>
        </div>
      )}
    </div>
  );
};

export default ListaLotesClima;
