import React from 'react';
import styles from './Cultivos.module.css';

const LoteCard = ({ lote, onEdit, onDelete }) => {
  return (
    <div className={styles.loteCard}>
      <div className={styles.cardHeader}>
        <h3>{lote.nombre}</h3>
        <div className={styles.cardActions}>
          <button
            onClick={() => onEdit(lote)}
            className={styles.editBtn}
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(lote.id)}
            className={styles.deleteBtn}
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.infoRow}>
          <span className={styles.label}>Ubicación:</span>
          <span>{lote.municipio}, {lote.departamento}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Variedad:</span>
          <span>{lote.variedad}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Hectáreas:</span>
          <span>{lote.hectareas} ha</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Sombra:</span>
          <span>{lote.nivel_sombra}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Altitud:</span>
          <span>{lote.altitud} msnm</span>
        </div>

        {lote.arboles_totales && (
          <div className={styles.infoRow}>
            <span className={styles.label}>Árboles totales:</span>
            <span>{lote.arboles_totales.toLocaleString()}</span>
          </div>
        )}

        {lote.descripcion && (
          <div className={styles.description}>
            <span className={styles.label}>Descripción:</span>
            <p>{lote.descripcion}</p>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <small>Creado: {new Date(lote.fecha_creacion).toLocaleDateString()}</small>
      </div>
    </div>
  );
};

export default LoteCard;