import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './Predicciones.css';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Predicciones = () => {
  const [predicciones, setPredicciones] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para formulario de nueva predicción
  const [nuevaPrediccion, setNuevaPrediccion] = useState({
    lote_id: '',
    tipo_prediccion: '3_dias',
    metodo_prediccion: 'random_forest'
  });
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    lote_id: '',
    tipo_prediccion: '',
    nivel_riesgo: '',
    fecha_desde: '',
    fecha_hasta: ''
  });

  useEffect(() => {
    cargarDatos();
    cargarLotes();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      
      // Aplicar filtros
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`http://127.0.0.1:8000/api/predicciones/predicciones/?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPredicciones(response.data.results || response.data);
      setError('');
    } catch (err) {
      setError('Error cargando predicciones: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const cargarLotes = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://127.0.0.1:8000/api/cultivos/lotes/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLotes(response.data.results || response.data);
    } catch (err) {
      console.error('Error cargando lotes:', err);
    }
  };

  const generarPrediccion = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await axios.post(
        'http://127.0.0.1:8000/api/predicciones/predicciones/generar_prediccion/',
        nuevaPrediccion,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.exito) {
        alert('¡Predicción generada exitosamente!');
        setNuevaPrediccion({
          lote_id: '',
          tipo_prediccion: '3_dias',
          metodo_prediccion: 'random_forest'
        });
        cargarDatos();
      } else {
        alert('Error: ' + response.data.error);
      }
    } catch (err) {
      alert('Error generando predicción: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    cargarDatos();
  };

  const limpiarFiltros = () => {
    setFiltros({
      lote_id: '',
      tipo_prediccion: '',
      nivel_riesgo: '',
      fecha_desde: '',
      fecha_hasta: ''
    });
  };

  // Configuración para gráfico de predicciones
  const crearGraficoPredicciones = (prediccion) => {
    const dias = prediccion.radiacion_predicha.map((_, index) => `Día ${index + 1}`);
    
    return {
      labels: dias,
      datasets: [
        {
          label: 'Radiación Predicha (W/m²)',
          data: prediccion.radiacion_predicha,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  const getRiesgoColor = (nivel) => {
    const colores = {
      'bajo': '#4CAF50',
      'medio': '#FFC107',
      'alto': '#FF9800',
      'critico': '#F44336'
    };
    return colores[nivel] || '#9E9E9E';
  };

  const getRiesgoIcon = (nivel) => {
    const iconos = {
      'bajo': '✅',
      'medio': '⚠️',
      'alto': '🔶',
      'critico': '🚨'
    };
    return iconos[nivel] || '❓';
  };

  return (
    <div className="predicciones-container">
      <h1>Predicciones de Radiación Solar</h1>

      {/* Formulario para Nueva Predicción */}
      <div className="nueva-prediccion-form">
        <h2>Generar Nueva Predicción</h2>
        <form onSubmit={generarPrediccion}>
          <div className="form-row">
            <div className="form-group">
              <label>Lote:</label>
              <select
                value={nuevaPrediccion.lote_id}
                onChange={(e) => setNuevaPrediccion({...nuevaPrediccion, lote_id: e.target.value})}
                required
              >
                <option value="">Seleccionar lote...</option>
                {lotes.map(lote => (
                  <option key={lote.id} value={lote.id}>
                    {lote.nombre} - {lote.variedad}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Horizonte de Predicción:</label>
              <select
                value={nuevaPrediccion.tipo_prediccion}
                onChange={(e) => setNuevaPrediccion({...nuevaPrediccion, tipo_prediccion: e.target.value})}
              >
                <option value="1_dia">1 día</option>
                <option value="3_dias">3 días</option>
                <option value="7_dias">7 días</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Método ML:</label>
              <select
                value={nuevaPrediccion.metodo_prediccion}
                onChange={(e) => setNuevaPrediccion({...nuevaPrediccion, metodo_prediccion: e.target.value})}
              >
                <option value="random_forest">Random Forest</option>
                <option value="linear_regression">Regresión Lineal</option>
              </select>
            </div>
            
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '⏳ Generando...' : '🔮 Generar Predicción'}
            </button>
          </div>
        </form>
      </div>

      {/* Filtros */}
      <div className="filtros-section">
        <h3>🔍 Filtros</h3>
        <div className="filtros-row">
          <select
            value={filtros.lote_id}
            onChange={(e) => setFiltros({...filtros, lote_id: e.target.value})}
          >
            <option value="">Todos los lotes</option>
            {lotes.map(lote => (
              <option key={lote.id} value={lote.id}>{lote.nombre}</option>
            ))}
          </select>
          
          <select
            value={filtros.tipo_prediccion}
            onChange={(e) => setFiltros({...filtros, tipo_prediccion: e.target.value})}
          >
            <option value="">Todos los tipos</option>
            <option value="1_dia">1 día</option>
            <option value="3_dias">3 días</option>
            <option value="7_dias">7 días</option>
          </select>
          
          <select
            value={filtros.nivel_riesgo}
            onChange={(e) => setFiltros({...filtros, nivel_riesgo: e.target.value})}
          >
            <option value="">Todos los riesgos</option>
            <option value="bajo">Bajo</option>
            <option value="medio">Medio</option>
            <option value="alto">Alto</option>
            <option value="critico">Crítico</option>
          </select>
          
          <input
            type="date"
            value={filtros.fecha_desde}
            onChange={(e) => setFiltros({...filtros, fecha_desde: e.target.value})}
            placeholder="Fecha desde"
          />
          
          <input
            type="date"
            value={filtros.fecha_hasta}
            onChange={(e) => setFiltros({...filtros, fecha_hasta: e.target.value})}
            placeholder="Fecha hasta"
          />
          
          <button onClick={aplicarFiltros} className="btn-secondary">Aplicar</button>
          <button onClick={limpiarFiltros} className="btn-outline">Limpiar</button>
        </div>
      </div>

      {/* Lista de Predicciones */}
      <div className="predicciones-lista">
        <h2>📋 Historial de Predicciones</h2>
        
        {loading && <p className="loading">⏳ Cargando predicciones...</p>}
        {error && <p className="error">❌ {error}</p>}
        
        {predicciones.length === 0 && !loading ? (
          <p className="no-data">No hay predicciones disponibles</p>
        ) : (
          <div className="predicciones-grid">
            {predicciones.map(prediccion => (
              <div key={prediccion.id} className="prediccion-card">
                <div className="prediccion-header">
                  <h3>🏠 {prediccion.lote?.nombre || 'Lote no disponible'}</h3>
                  <span className="fecha">
                    📅 {new Date(prediccion.fecha_generacion).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <div className="prediccion-info">
                  <div className="info-item">
                    <span className="label">Tipo:</span>
                    <span className="value">{prediccion.tipo_prediccion.replace('_', ' ')}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Método:</span>
                    <span className="value">{prediccion.metodo_utilizado}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Confianza:</span>
                    <span className="value">{prediccion.confianza_prediccion}%</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Riesgo:</span>
                    <span 
                      className="value riesgo"
                      style={{ color: getRiesgoColor(prediccion.nivel_riesgo_predicho) }}
                    >
                      {getRiesgoIcon(prediccion.nivel_riesgo_predicho)} {prediccion.nivel_riesgo_predicho}
                    </span>
                  </div>
                  {prediccion.alerta_generada && (
                    <div className="alerta-badge">
                      🚨 ALERTA GENERADA
                    </div>
                  )}
                </div>
                
                <div className="prediccion-datos">
                  <h4>📊 Predicciones (W/m²)</h4>
                  <div className="datos-grid">
                    {prediccion.radiacion_predicha?.map((valor, index) => (
                      <div key={index} className="dato-item">
                        <span className="dia">Día {index + 1}</span>
                        <span className="valor">{valor}</span>
                      </div>
                    )) || <span>No disponible</span>}
                  </div>
                </div>
                
                {prediccion.radiacion_predicha && prediccion.radiacion_predicha.length > 0 && (
                  <div className="prediccion-grafico">
                    <Line 
                      data={crearGraficoPredicciones(prediccion)} 
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: true,
                            text: `Predicción ${prediccion.tipo_prediccion.replace('_', ' ')}`
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Radiación Solar (W/m²)'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: 'Días'
                            }
                          }
                        }
                      }} 
                    />
                  </div>
                )}
                
                <div className="prediccion-footer">
                  <small>
                    🔧 Datos históricos: {prediccion.datos_historicos_usados} días
                    {prediccion.r2_score && ` | R²: ${parseFloat(prediccion.r2_score).toFixed(3)}`}
                    {prediccion.mae_score && ` | MAE: ${parseFloat(prediccion.mae_score).toFixed(2)}`}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Predicciones;