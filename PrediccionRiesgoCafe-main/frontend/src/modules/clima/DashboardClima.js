import React, { useState, useEffect } from 'react';
import climaServices from './api';
import styles from './Clima.module.css';

const DashboardClima = () => {
  const [datosClima, setDatosClima] = useState({
    temperatura: '--',
    humedad: '--',
    irradiancia: '--',
    nubosidad: '--',
    velocidad_viento: '--',
    precipitacion: '--',
    actualizacion: '--',
    fuente: 'Cargando...',
    descripcion_clima: 'Obteniendo datos...',
    ciudad: '--'
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  // Verificar autenticación al cargar
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setDebugInfo(`Token: ${token ? '✅ Presente' : '❌ Ausente'}`);

    if (!token) {
      setError('❌ No estás autenticado. Por favor, inicia sesión.');
      return;
    }

    cargarLotesUsuario();
  }, []);

  const cargarLotesUsuario = async () => {
    try {
      console.log('🔄 Cargando lotes del usuario...');

      // Primero intentar cargar lotes reales del dashboard
      const response = await climaServices.obtenerResumenActual();

      if (response.data && response.data.length > 0) {
        console.log('✅ Lotes reales cargados:', response.data);
        const lotesFormateados = response.data.map(lote => ({
          id: lote.lote_id,
          nombre: lote.lote_nombre,
          municipio: lote.lote_municipio
        }));

        setLotes(lotesFormateados);
        if (lotesFormateados.length > 0) {
          setLoteSeleccionado(lotesFormateados[0].id);
          await cargarDatosClimaticos(lotesFormateados[0].id);
        }
      } else {
        // Fallback a datos de ejemplo
        throw new Error('No hay lotes reales');
      }
    } catch (err) {
      console.warn('⚠️ Usando lotes de ejemplo:', err.message);
      // Datos de ejemplo como fallback
      const lotesEjemplo = [
        { id: 1, nombre: 'Lote 1', municipio: 'Antioquia' },
        { id: 2, nombre: 'Lote 2', municipio: 'Caldas' },
        { id: 3, nombre: 'Lote 3', municipio: 'Huila' }
      ];
      setLotes(lotesEjemplo);
      if (lotesEjemplo.length > 0) {
        setLoteSeleccionado(lotesEjemplo[0].id);
        await cargarDatosClimaticos(lotesEjemplo[0].id);
      }
    }
  };

  const cargarDatosClimaticos = async (loteId) => {
    try {
      setCargando(true);
      setError(null);

      console.log(`📡 Solicitando datos climáticos para lote ${loteId}...`);
      const response = await climaServices.obtenerDatosLote(loteId);
      console.log('📊 Respuesta recibida:', response);

      if (response.data && response.data.length > 0) {
        const ultimoDato = response.data[0];
        console.log('✅ Datos procesados:', ultimoDato);

        setDatosClima({
          temperatura: parseFloat(ultimoDato.temperatura || 0).toFixed(1),
          humedad: parseFloat(ultimoDato.humedad_relativa || 0).toFixed(1),
          irradiancia: parseFloat(ultimoDato.irradiancia_solar || 0).toFixed(1),
          nubosidad: parseFloat(ultimoDato.nubosidad || 0).toFixed(1),
          velocidad_viento: parseFloat(ultimoDato.velocidad_viento || 0).toFixed(1),
          precipitacion: parseFloat(ultimoDato.precipitacion || 0).toFixed(1),
          actualizacion: new Date().toLocaleTimeString('es-CO'),
          fuente: ultimoDato.fuente_datos || 'simulación',
          descripcion_clima: ultimoDato.descripcion_clima || 'Datos climáticos',
          ciudad: ultimoDato.ciudad || ultimoDato.lote_municipio || 'Ubicación'
        });

        setDebugInfo(prev => `${prev} | Fuente: ${ultimoDato.fuente_datos || 'simulación'}`);
      } else {
        throw new Error('No hay datos disponibles');
      }
    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      setError(`Error al cargar datos climáticos: ${err.message}`);

      // Datos de ejemplo como último recurso
      setDatosClima({
        temperatura: '22.5',
        humedad: '75',
        irradiancia: '850',
        nubosidad: '30',
        velocidad_viento: '2.5',
        precipitacion: '0.0',
        actualizacion: new Date().toLocaleTimeString('es-CO'),
        fuente: 'ejemplo',
        descripcion_clima: 'Datos de ejemplo - Error de conexión',
        ciudad: 'Medellín'
      });
    } finally {
      setCargando(false);
    }
  };

  const actualizarDatos = async () => {
    if (loteSeleccionado) {
      console.log('🔄 Actualizando datos manualmente...');
      await cargarDatosClimaticos(loteSeleccionado);
    }
  };

  const forzarActualizacionOpenWeather = async () => {
    if (!loteSeleccionado) {
      alert('Selecciona un lote primero');
      return;
    }

    try {
      setCargando(true);
      console.log('🔧 Forzando actualización con OpenWeather...');

      const response = await climaServices.actualizarDatosLote(loteSeleccionado);
      console.log('✅ Actualización forzada:', response);

      // Esperar un momento y recargar datos
      setTimeout(() => {
        cargarDatosClimaticos(loteSeleccionado);
      }, 1000);

    } catch (error) {
      console.error('❌ Error forzando actualización:', error);
      setError('Error forzando actualización: ' + error.message);
    }
  };

  const handleLoteChange = (event) => {
    const loteId = parseInt(event.target.value);
    setLoteSeleccionado(loteId);
    cargarDatosClimaticos(loteId);
  };

  return (
    <div className={styles.contenedor}>
      {/* Header Principal */}
      <header className={styles.headerPrincipal}>
        <h1>Clima</h1>
        <div className={styles.controlesSuperiores}>
          <select
            className={styles.selectorLote}
            value={loteSeleccionado || ''}
            onChange={handleLoteChange}
          >
            <option value="">Seleccionar lote</option>
            {lotes.map(lote => (
              <option key={lote.id} value={lote.id}>
                {lote.nombre} - {lote.municipio}
              </option>
            ))}
          </select>

          <div className={styles.estadoActual}>
            <span className={styles.horaActual}>
              Actualizado: {datosClima.actualizacion}
            </span>
            <button
              className={styles.botonActualizar}
              onClick={actualizarDatos}
              disabled={cargando}
            >
              {cargando ? '🔄 Cargando...' : 'Actualizar'}
            </button>

            {/* Botón para forzar actualización con OpenWeather */}
            <button
              className={styles.botonDiagnostico}
              onClick={forzarActualizacionOpenWeather}
              disabled={cargando}
            >
              🔧 Forzar OpenWeather
            </button>
          </div>
        </div>
      </header>

      {/* Información de Debug */}
      <div className={styles.debugInfo}>
        <small>{debugInfo}</small>
      </div>

      {error && (
        <div className={styles.error}>
          ⚠️ {error}
          <button onClick={actualizarDatos}>Reintentar</button>
        </div>
      )}

      <div className={styles.gridPrincipal}>
        {/* Sección Temperatura */}
        <section className={styles.seccionTemperatura}>
          <div className={styles.tarjetaTemperatura}>
            <div className={styles.temperaturaHeader}>
              <h2>🌡️ TEMPERATURA</h2>
            </div>
            <div className={styles.temperaturaValor}>
              {datosClima.temperatura}°C
            </div>
            <div className={styles.fuenteDatos}>
              <small>
                {datosClima.fuente === 'openweather_real'
                  ? '✅ Datos en tiempo real'
                  : '🌎 Datos de referencia'}
              </small>
            </div>
            <div className={styles.estadoRiesgo}>
              {datosClima.temperatura > 30 ? '🔴 Alta' :
               datosClima.temperatura > 25 ? '🟡 Media' : '🟢 Óptima'}
            </div>
          </div>
        </section>

        {/* Sección Información */}
        <section className={styles.seccionInfo}>
          <div className={styles.tarjetaInfo}>
            <h3>🌤️ {datosClima.descripcion_clima}</h3>
            <p>📍 {datosClima.ciudad}</p>

            <div className={styles.metricasAdicionales}>
              <div className={styles.metrica}>
                <span className={styles.metricaLabel}>☀️ Irradiancia Solar:</span>
                <span className={styles.metricaValor}>{datosClima.irradiancia} W/m²</span>
              </div>
              <div className={styles.metrica}>
                <span className={styles.metricaLabel}>☁️ Nubosidad:</span>
                <span className={styles.metricaValor}>{datosClima.nubosidad}%</span>
              </div>
              <div className={styles.metrica}>
                <span className={styles.metricaLabel}>💨 Viento:</span>
                <span className={styles.metricaValor}>{datosClima.velocidad_viento} m/s</span>
              </div>
              <div className={styles.metrica}>
                <span className={styles.metricaLabel}>🌧️ Precipitación:</span>
                <span className={styles.metricaValor}>{datosClima.precipitacion} mm</span>
              </div>
            </div>

            <div className={styles.separador}></div>

            <div className={styles.recomendaciones}>
              <h4>Recomendaciones:</h4>
              {datosClima.temperatura > 30 && (
                <p>🌡️ Temperatura alta - Considera aumentar sombra temporal</p>
              )}
              {datosClima.humedad < 50 && (
                <p>💧 Humedad baja - Verificar sistema de riego</p>
              )}
              {datosClima.irradiancia > 1200 && (
                <p>☀️ Alta irradiancia - Monitorear estrés térmico</p>
              )}
              {parseFloat(datosClima.precipitacion) > 10 && (
                <p>🌧️ Alta precipitación - Verificar drenaje</p>
              )}
            </div>
          </div>
        </section>

        {/* Sección Humedad */}
        <section className={styles.seccionHumedad}>
          <div className={styles.tarjetaHumedad}>
            <div className={styles.humedadHeader}>
              <h2>💧 HUMEDAD</h2>
            </div>
            <div className={styles.humedadValor}>
              {datosClima.humedad}%
            </div>
            <div className={styles.fuenteDatos}>
              <small>Fuente: {datosClima.fuente}</small>
            </div>
            <div className={styles.estadoRiesgo}>
              {datosClima.humedad < 40 ? '🔴 Baja' :
               datosClima.humedad < 60 ? '🟡 Normal' : '🟢 Óptima'}
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2024 Predicción de riesgo de café</p>
      </footer>
    </div>
  );
};

export default DashboardClima;