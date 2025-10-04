import React, { useState, useContext } from 'react';
import { AuthContext } from '../users/AuthContext';
import { createLote, formularioData } from './api';

const LoteForm = ({ onLoteCreado, onCancel }) => {
  const { accessToken } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    departamento: 'Antioquia',
    municipio: '',
    latitud: '',
    longitud: '',
    variedad: 'Castillo',
    hectareas: '',
    nivel_sombra: 'Medio',
    altitud: '',
    arboles_hectarea: 5000,
    edad_plantacion: 2,
    fecha_siembra: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    // Convertir números
    let finalValue = value;
    if (type === 'number') {
      finalValue = value === '' ? '' : Number(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('📤 Datos a enviar:', formData);

      // Validaciones básicas
      if (!formData.nombre?.trim()) {
        throw new Error('El nombre del lote es requerido');
      }
      if (!formData.municipio?.trim()) {
        throw new Error('El municipio es requerido');
      }
      if (!formData.hectareas || formData.hectareas <= 0) {
        throw new Error('Las hectáreas deben ser mayores a 0');
      }
      if (!formData.altitud || formData.altitud < 400) {
        throw new Error('La altitud mínima es 400 msnm');
      }

      // Preparar datos para enviar (convertir números)
      const datosEnviar = {
        ...formData,
        hectareas: Number(formData.hectareas),
        altitud: Number(formData.altitud),
        arboles_hectarea: Number(formData.arboles_hectarea),
        edad_plantacion: Number(formData.edad_plantacion),
        // Campos opcionales - si están vacíos, enviar null
        latitud: formData.latitud ? Number(formData.latitud) : null,
        longitud: formData.longitud ? Number(formData.longitud) : null,
        descripcion: formData.descripcion || null,
        fecha_siembra: formData.fecha_siembra || null
      };

      console.log('🚀 Enviando a API:', datosEnviar);

      const response = await createLote(datosEnviar, accessToken);
      console.log('✅ Lote creado exitosamente:', response.data);

      // Limpiar formulario
      setFormData({
        nombre: '',
        descripcion: '',
        departamento: 'Antioquia',
        municipio: '',
        latitud: '',
        longitud: '',
        variedad: 'Castillo',
        hectareas: '',
        nivel_sombra: 'Medio',
        altitud: '',
        arboles_hectarea: 5000,
        edad_plantacion: 2,
        fecha_siembra: ''
      });

      // Notificar al componente padre
      if (onLoteCreado) {
        onLoteCreado(response.data);
      }

    } catch (err) {
      console.error('❌ Error completo:', err);
      console.error('❌ Response data:', err.response?.data);
      console.error('❌ Response status:', err.response?.status);

      // Mostrar errores específicos del backend
      if (err.response?.data) {
        const errorData = err.response.data;

        if (typeof errorData === 'object') {
          // Procesar errores de validación de Django
          let errorMessages = [];

          // Recorrer todos los campos con errores
          Object.entries(errorData).forEach(([campo, errores]) => {
            if (Array.isArray(errores)) {
              errorMessages.push(...errores);
            } else {
              errorMessages.push(errores);
            }
          });

          setError(`Errores: ${errorMessages.join(', ')}`);
        } else {
          setError(`Error: ${errorData}`);
        }
      } else {
        setError(err.message || 'Error al crear el lote');
      }
    } finally {
      setLoading(false);
    }
  };

  // Estilos en línea para rapidez
  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    },
    form: {
      background: 'white',
      padding: '30px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    title: {
      textAlign: 'center',
      color: '#2c5530',
      marginBottom: '30px',
      fontSize: '24px'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
      marginBottom: '20px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    label: {
      marginBottom: '5px',
      fontWeight: '600',
      color: '#333',
      fontSize: '14px'
    },
    input: {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px'
    },
    select: {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      background: 'white'
    },
    textarea: {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      resize: 'vertical',
      minHeight: '80px'
    },
    formActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '15px',
      marginTop: '30px',
      paddingTop: '20px',
      borderTop: '1px solid #e0e0e0'
    },
    cancelBtn: {
      padding: '10px 20px',
      background: '#f5f5f5',
      color: '#333',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    saveBtn: {
      padding: '10px 20px',
      background: '#2c5530',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    saveBtnDisabled: {
      padding: '10px 20px',
      background: '#cccccc',
      color: '#666',
      border: 'none',
      borderRadius: '4px',
      cursor: 'not-allowed',
      fontSize: '14px'
    },
    error: {
      background: '#ffebee',
      color: '#d32f2f',
      padding: '10px 15px',
      borderRadius: '4px',
      marginBottom: '20px',
      borderLeft: '4px solid #d32f2f'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.form}>
        <h2 style={styles.title}>🌱 Nuevo Lote de Café</h2>

        {error && (
          <div style={styles.error}>
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Fila 1: Nombre y Departamento */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nombre del Lote *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Finca La Esperanza"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Departamento *</label>
              <select
                name="departamento"
                value={formData.departamento}
                onChange={handleChange}
                style={styles.select}
                required
              >
                {formularioData.departamentos.map(depto => (
                  <option key={depto} value={depto}>{depto}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 2: Municipio y Variedad */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Municipio *</label>
              <input
                type="text"
                name="municipio"
                value={formData.municipio}
                onChange={handleChange}
                placeholder="Ej: Manizales"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Variedad de Café *</label>
              <select
                name="variedad"
                value={formData.variedad}
                onChange={handleChange}
                style={styles.select}
                required
              >
                {formularioData.variedades.map(variedad => (
                  <option key={variedad} value={variedad}>{variedad}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 3: Hectáreas y Sombra */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Hectáreas *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="hectareas"
                value={formData.hectareas}
                onChange={handleChange}
                placeholder="Ej: 2.5"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Nivel de Sombra *</label>
              <select
                name="nivel_sombra"
                value={formData.nivel_sombra}
                onChange={handleChange}
                style={styles.select}
                required
              >
                {formularioData.nivelesSombra.map(nivel => (
                  <option key={nivel} value={nivel}>{nivel}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 4: Altitud y Árboles/Hectárea */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Altitud (msnm) *</label>
              <input
                type="number"
                name="altitud"
                value={formData.altitud}
                onChange={handleChange}
                placeholder="Ej: 1500"
                min="400"
                max="2400"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Árboles por Hectárea</label>
              <input
                type="number"
                name="arboles_hectarea"
                value={formData.arboles_hectarea}
                onChange={handleChange}
                min="1000"
                max="10000"
                style={styles.input}
              />
            </div>
          </div>

          {/* Fila 5: Edad y Fecha Siembra */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Edad de Plantación (años)</label>
              <input
                type="number"
                name="edad_plantacion"
                value={formData.edad_plantacion}
                onChange={handleChange}
                min="1"
                max="50"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Fecha de Siembra (Opcional)</label>
              <input
                type="date"
                name="fecha_siembra"
                value={formData.fecha_siembra}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </div>

          {/* Fila 6: Coordenadas */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Latitud (Opcional)</label>
              <input
                type="number"
                step="any"
                name="latitud"
                value={formData.latitud}
                onChange={handleChange}
                placeholder="Ej: 4.815"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Longitud (Opcional)</label>
              <input
                type="number"
                step="any"
                name="longitud"
                value={formData.longitud}
                onChange={handleChange}
                placeholder="Ej: -75.695"
                style={styles.input}
              />
            </div>
          </div>

          {/* Descripción */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Descripción (Opcional)</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Describe las características de tu lote..."
              style={styles.textarea}
            />
          </div>

          {/* Botones */}
          <div style={styles.formActions}>
            <button
              type="button"
              onClick={onCancel}
              style={styles.cancelBtn}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={loading ? styles.saveBtnDisabled : styles.saveBtn}
            >
              {loading ? '🔄 Creando...' : '🌱 Crear Lote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoteForm;