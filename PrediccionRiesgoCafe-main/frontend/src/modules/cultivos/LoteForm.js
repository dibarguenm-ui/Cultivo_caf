import React, { useState, useContext } from 'react';
import { AuthContext } from '../users/AuthContext';
import { createLote, formularioData } from './api';
import MapaPicker from './MapaPicker';
import UmbralesRadiacion from './UmbralesRadiacion';

// Función para determinar el departamento basado en coordenadas
const determinarDepartamento = (latitud, longitud) => {
  const lat = parseFloat(latitud);
  const lon = parseFloat(longitud);
  
  // Rangos aproximados de departamentos cafeteros principales de Colombia
  const departamentosCoords = {
    'Antioquia': { lat_min: 5.4, lat_max: 8.9, lon_min: -77.1, lon_max: -73.8 },
    'Caldas': { lat_min: 4.8, lat_max: 5.8, lon_min: -75.8, lon_max: -74.7 },
    'Risaralda': { lat_min: 4.7, lat_max: 5.3, lon_min: -76.3, lon_max: -75.4 },
    'Quindío': { lat_min: 4.2, lat_max: 4.8, lon_min: -75.9, lon_max: -75.4 },
    'Valle del Cauca': { lat_min: 3.1, lat_max: 5.1, lon_min: -77.2, lon_max: -75.7 },
    'Cundinamarca': { lat_min: 3.7, lat_max: 5.8, lon_min: -74.9, lon_max: -73.0 },
    'Huila': { lat_min: 1.4, lat_max: 3.4, lon_min: -76.6, lon_max: -74.4 },
    'Tolima': { lat_min: 3.1, lat_max: 5.6, lon_min: -76.1, lon_max: -74.4 },
    'Cauca': { lat_min: 1.6, lat_max: 3.2, lon_min: -77.8, lon_max: -75.6 },
    'Nariño': { lat_min: 0.5, lat_max: 2.8, lon_min: -79.0, lon_max: -76.2 },
    'Santander': { lat_min: 5.8, lat_max: 8.7, lon_min: -74.4, lon_max: -72.1 },
    'Boyacá': { lat_min: 4.5, lat_max: 7.3, lon_min: -74.0, lon_max: -71.6 }
  };
  
  // Buscar el departamento que contenga las coordenadas
  for (const [departamento, coords] of Object.entries(departamentosCoords)) {
    if (lat >= coords.lat_min && lat <= coords.lat_max &&
        lon >= coords.lon_min && lon <= coords.lon_max) {
      return departamento;
    }
  }
  
  return null; // No se encontró departamento específico
};

const LoteForm = ({ onLoteCreado, onCancel }) => {
  const { accessToken } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    departamento: 'Antioquia',
    variedad: 'Castillo',
    hectareas: '',
    nivel_sombra: 'Medio',
    altitud: ''
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
      if (!formData.hectareas || formData.hectareas <= 0) {
        throw new Error('Las hectáreas deben ser mayores a 0');
      }

      // Preparar datos para enviar (convertir números)
      const datosEnviar = {
        ...formData,
        hectareas: Number(formData.hectareas),
        altitud: formData.altitud ? Number(formData.altitud) : null,
        // Campos opcionales - si están vacíos, enviar null
        latitud: formData.latitud ? Number(formData.latitud) : null,
        longitud: formData.longitud ? Number(formData.longitud) : null,
        descripcion: formData.descripcion || null
      };

      console.log('🚀 Enviando a API:', datosEnviar);

      const response = await createLote(datosEnviar, accessToken);
      console.log('✅ Lote creado exitosamente:', response.data);

      // Limpiar formulario
      setFormData({
        nombre: '',
        descripcion: '',
        departamento: 'Antioquia',
        latitud: '',
        longitud: '',
        variedad: 'Castillo',
        hectareas: '',
        nivel_sombra: 'Medio',
        altitud: ''
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
              <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                💡 El departamento se detecta automáticamente al seleccionar coordenadas en el mapa
              </small>
            </div>
          </div>

          {/* Fila 2: Variedad */}
          <div style={styles.formRow}>
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

          {/* Sección: Ubicación del Lote */}
          <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #e0e0e0' }}>
            <h3 style={{ color: '#2c5530', marginBottom: '20px', fontSize: '18px' }}>
              📍 Ubicación del Lote
            </h3>
            
            <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
              Haz clic en el mapa para seleccionar la ubicación exacta de tu lote. 
              Se obtendrán automáticamente las coordenadas y la altitud.
            </p>

            {/* Mostrar mapa interactivo */}
            <MapaPicker 
              onLocationSelected={(location) => {
                console.log('📍 Ubicación seleccionada:', location);
                
                // Determinar departamento automáticamente basado en coordenadas
                const departamentoDetectado = determinarDepartamento(location.latitud, location.longitud);
                
                // Actualizar formulario con coordenadas y departamento
                const nuevosFormData = {
                  ...formData,
                  latitud: location.latitud,
                  longitud: location.longitud,
                  altitud: location.altitud
                };
                
                // Solo actualizar departamento si se detectó uno válido
                if (departamentoDetectado) {
                  nuevosFormData.departamento = departamentoDetectado;
                  console.log(`🗺️ Departamento detectado automáticamente: ${departamentoDetectado}`);
                }
                
                setFormData(nuevosFormData);
              }}
              initialLat={formData.latitud || 4.815}
              initialLng={formData.longitud || -75.695}
              token={accessToken}
            />

            {/* Mostrar coordenadas actuales */}
            {(formData.latitud || formData.longitud || formData.altitud) && (
              <div style={{
                background: '#f0f8f0',
                padding: '15px',
                borderRadius: '4px',
                marginTop: '15px',
                border: '1px solid #c8e6c9'
              }}>
                <p style={{ margin: '0 0 8px 0', color: '#2c5530', fontWeight: 'bold' }}>
                  ✅ Ubicación Registrada
                </p>
                <p style={{ margin: '4px 0', color: '#555' }}>
                  <strong>Latitud:</strong> {formData.latitud ? formData.latitud.toFixed(3) : 'No asignada'}
                </p>
                <p style={{ margin: '4px 0', color: '#555' }}>
                  <strong>Longitud:</strong> {formData.longitud ? formData.longitud.toFixed(3) : 'No asignada'}
                </p>
                <p style={{ margin: '4px 0', color: '#555' }}>
                  <strong>Altitud:</strong> {formData.altitud ? `${formData.altitud} msnm` : 'No asignada'}
                </p>
              </div>
            )}
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