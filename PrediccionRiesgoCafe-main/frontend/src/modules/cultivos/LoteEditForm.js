import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../users/AuthContext';
import { updateLote, formularioData } from './api';
import UmbralesRadiacion from './UmbralesRadiacion';

const LoteEditForm = ({ lote, onLoteActualizado, onCancel }) => {
  const { accessToken } = useContext(AuthContext);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lote) {
      setFormData({
        nombre: lote.nombre || '',
        descripcion: lote.descripcion || '',
        departamento: lote.departamento || 'Antioquia',
        variedad: lote.variedad || 'Castillo',
        hectareas: lote.hectareas || '',
        nivel_sombra: lote.nivel_sombra || 'Medio'
      });
    }
  }, [lote]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    if (type === 'number') {
      finalValue = value === '' ? '' : Number(value);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const datosEnviar = {
        nombre: formData.nombre,
        departamento: formData.departamento,
        variedad: formData.variedad,
        hectareas: Number(formData.hectareas),
        nivel_sombra: formData.nivel_sombra,
        descripcion: formData.descripcion || null
      };

      const response = await updateLote(lote.id, datosEnviar, accessToken);

      if (onLoteActualizado) {
        onLoteActualizado(response.data);
      }

    } catch (err) {
      console.error('Error editando lote:', err);
      setError(err.response?.data?.detail || err.message || 'Error al actualizar el lote');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: { maxWidth: '800px', margin: '0 auto', padding: '20px' },
    form: { background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
    title: { textAlign: 'center', color: '#2c5530', marginBottom: '30px', fontSize: '24px' },
    formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column' },
    label: { marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '14px' },
    input: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' },
    select: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', background: 'white' },
    textarea: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', resize: 'vertical', minHeight: '80px' },
    formActions: { display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' },
    cancelBtn: { padding: '10px 20px', background: '#f5f5f5', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
    saveBtn: { padding: '10px 20px', background: '#2c5530', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
    saveBtnDisabled: { padding: '10px 20px', background: '#cccccc', color: '#666', border: 'none', borderRadius: '4px', cursor: 'not-allowed', fontSize: '14px' },
    error: { background: '#ffebee', color: '#d32f2f', padding: '10px 15px', borderRadius: '4px', marginBottom: '20px', borderLeft: '4px solid #d32f2f' }
  };

  if (!lote) return null;

  return (
    <div style={styles.container}>
      <div style={styles.form}>
        <h2 style={styles.title}>✏️ Editar Lote: {lote.nombre}</h2>

        {error && <div style={styles.error}><strong>❌ Error:</strong> {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Fila 1: Nombre y Departamento */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nombre del Lote *</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} style={styles.input} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Departamento *</label>
              <select name="departamento" value={formData.departamento} onChange={handleChange} style={styles.select} required>
                {formularioData.departamentos.map(depto => <option key={depto} value={depto}>{depto}</option>)}
              </select>
            </div>
          </div>

          {/* Fila 2: Variedad */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Variedad de Café *</label>
              <select name="variedad" value={formData.variedad} onChange={handleChange} style={styles.select} required>
                {formularioData.variedades.map(variedad => <option key={variedad} value={variedad}>{variedad}</option>)}
              </select>
            </div>
          </div>

          {/* Mostrar Umbrales de Radiación Solar */}
          {formData.variedad && (
            <div style={{
              background: '#fafafa',
              padding: '20px',
              borderRadius: '4px',
              marginBottom: '20px',
              border: '1px solid #e0e0e0'
            }}>
              <h4 style={{ color: '#2c5530', marginTop: 0, marginBottom: '15px', fontSize: '16px' }}>
                ☀️ Umbrales de Radiación Solar para {formData.variedad}
              </h4>
              <UmbralesRadiacion 
                variedad={formData.variedad}
                token={accessToken}
              />
            </div>
          )}

          {/* Fila 3: Hectáreas y Sombra */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Hectáreas *</label>
              <input type="number" step="0.01" min="0.01" name="hectareas" value={formData.hectareas} onChange={handleChange} style={styles.input} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nivel de Sombra *</label>
              <select name="nivel_sombra" value={formData.nivel_sombra} onChange={handleChange} style={styles.select} required>
                {formularioData.nivelesSombra.map(nivel => <option key={nivel} value={nivel}>{nivel}</option>)}
              </select>
            </div>
          </div>

          {/* Sección: Ubicación del Lote (READ-ONLY) */}
          <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #e0e0e0' }}>
            <h3 style={{ color: '#2c5530', marginBottom: '20px', fontSize: '18px' }}>
              📍 Ubicación del Lote (No se puede editar)
            </h3>
            
            {(lote.latitud || lote.longitud || lote.altitud) && (
              <div style={{
                background: '#f0f8f0',
                padding: '15px',
                borderRadius: '4px',
                border: '1px solid #c8e6c9'
              }}>
                <p style={{ margin: '0 0 8px 0', color: '#2c5530', fontWeight: 'bold' }}>
                  ✅ Ubicación Registrada
                </p>
                <p style={{ margin: '4px 0', color: '#555' }}>
                  <strong>Latitud:</strong> {lote.latitud ? parseFloat(lote.latitud).toFixed(3) : 'No asignada'}
                </p>
                <p style={{ margin: '4px 0', color: '#555' }}>
                  <strong>Longitud:</strong> {lote.longitud ? parseFloat(lote.longitud).toFixed(3) : 'No asignada'}
                </p>
                <p style={{ margin: '4px 0', color: '#555' }}>
                  <strong>Altitud:</strong> {lote.altitud ? `${lote.altitud} msnm` : 'No asignada'}
                </p>
              </div>
            )}
          </div>

          {/* Descripción */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Descripción (Opcional)</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} style={styles.textarea} placeholder="Describe las características de tu lote..." />
          </div>

          <div style={styles.formActions}>
            <button type="button" onClick={onCancel} style={styles.cancelBtn} disabled={loading}>Cancelar</button>
            <button type="submit" disabled={loading} style={loading ? styles.saveBtnDisabled : styles.saveBtn}>
              {loading ? '🔄 Actualizando...' : '💾 Actualizar Lote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoteEditForm;