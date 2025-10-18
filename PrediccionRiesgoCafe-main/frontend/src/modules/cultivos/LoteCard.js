import React from 'react';
import { useContext } from 'react';
import { AuthContext } from '../users/AuthContext';
import styles from './Cultivos.module.css';
import UmbralesRadiacion from './UmbralesRadiacion';

const LoteCard = ({ lote, onEdit, onDelete }) => {
  const { accessToken } = useContext(AuthContext);
  
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
          <span>{lote.departamento}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Área:</span>
          <span>{lote.hectareas}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Variedad:</span>
          <span>{lote.variedad}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Nivel de Sombra:</span>
          <span>{lote.nivel_sombra}</span>
        </div>

        {lote.descripcion && (
          <div className={styles.description}>
            <span className={styles.label}>Descripción:</span>
            <p>{lote.descripcion}</p>
          </div>
        )}

        {/* Mostrar Umbrales de Radiación Solar */}
        {lote.variedad && (
          <div style={{
            marginTop: '15px',
            paddingTop: '15px',
            borderTop: '1px solid #e0e0e0'
          }}>
            <h4 style={{ color: '#2c5530', marginBottom: '12px', fontSize: '14px' }}>
              ☀️ Umbrales de Radiación Solar
            </h4>
            <UmbralesRadiacion 
              variedad={lote.variedad}
              token={accessToken}
            />
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