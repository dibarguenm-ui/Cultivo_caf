import React, { useState, useEffect } from 'react';
import climaServices from './api';
import styles from './Clima.module.css';
import HistoricoMediciones from './HistoricoMediciones';

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
  const [esInicial, setEsInicial] = useState(true); // Bandera para detectar cambio manual vs inicial
  const [actualizacionTrigger, setActualizacionTrigger] = useState(0); // Trigger para recargar histórico

  // Verificar autenticación al cargar
  useEffect(() => {
    const cargarInicial = async () => {
      // Intentar tanto accessToken como access_token
      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');

      if (!token) {
        setError('❌ No estás autenticado. Por favor, inicia sesión.');
        return;
      }

      await cargarLotesUsuario();
      setEsInicial(false); // Ya no es la carga inicial
    };

    cargarInicial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Efecto para recargar datos cuando cambia el lote seleccionado (ej: cambio de cultivo)
  // Pero NO por el dropdown manual
  useEffect(() => {
    if (!esInicial && loteSeleccionado) {
      console.log(`🔄 Lote cambiado a ${loteSeleccionado} - Actualizando automáticamente...`);
      cargarDatosClimaticos(loteSeleccionado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loteSeleccionado]);

  const cargarLotesUsuario = async () => {
    try {
      console.log('🔄 Cargando lotes del usuario...');

      // Obtener lotes reales del usuario desde cultivos
      const response = await climaServices.obtenerLotesUsuario();

      if (response.data && response.data.length > 0) {
        console.log('✅ Lotes obtenidos:', response.data);
        const lotesFormateados = response.data.map(lote => ({
          id: lote.id,
          nombre: lote.nombre || `Lote ${lote.id}`,
          departamento: lote.departamento || 'Desconocido'
        }));

        setLotes(lotesFormateados);
        
        if (lotesFormateados.length > 0) {
          setLoteSeleccionado(lotesFormateados[0].id);
          await cargarDatosClimaticos(lotesFormateados[0].id);
        }
      } else {
        throw new Error('No hay lotes disponibles');
      }
    } catch (err) {
      console.error('❌ Error cargando lotes:', err.message);
      setError(`No se pudieron cargar los lotes. ${err.message}`);
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
        // Obtener el ÚLTIMO registro (más reciente)
        // La API ya ordena por fecha descendente, así que [0] es el más reciente
        const ultimoDato = response.data[0];
        console.log('✅ Datos procesados (más reciente):', ultimoDato);
        console.log(`   Fecha: ${ultimoDato.fecha_medicion}`);
        console.log(`   Fuente: ${ultimoDato.fuente_datos}`);

        setDatosClima({
          temperatura: parseFloat(ultimoDato.temperatura || 0).toFixed(1),
          humedad: parseFloat(ultimoDato.humedad_relativa || 0).toFixed(1),
          irradiancia: parseFloat(ultimoDato.irradiancia_solar || 0).toFixed(1),
          nubosidad: parseFloat(ultimoDato.nubosidad || 0).toFixed(1),
          velocidad_viento: parseFloat(ultimoDato.velocidad_viento || 0).toFixed(1),
          precipitacion: parseFloat(ultimoDato.precipitacion || 0).toFixed(1),
          actualizacion: new Date().toLocaleTimeString('es-CO'),
          fuente: ultimoDato.fuente_datos || 'real',
          descripcion_clima: ultimoDato.descripcion_clima || 'Datos climáticos',
          ciudad: ultimoDato.ciudad || ultimoDato.lote_departamento || 'Ubicación'
        });

        setCargando(false);
      } else {
        // No hay datos en BD - el usuario debe actualizar manualmente
        console.warn('⚠️ No hay datos en BD para este lote');
        console.log('💡 El usuario debe hacer clic en "Actualizar datos" para obtener la primera medición');
        
        setDatosClima(null);
        setError('No hay datos climáticos para este lote. Haz clic en "Actualizar datos" para obtener la primera medición.');
        setCargando(false);
      }
    } catch (err) {
      console.error('❌ Error cargando datos:', err);
      setError(`Error al cargar datos climáticos: ${err.message}`);
      setCargando(false);
    }
  };

  const actualizarDatos = async () => {
    if (!loteSeleccionado) {
      setError('Por favor selecciona un lote');
      return;
    }
    
    try {
      console.log(`🔄 Iniciando actualización manual para lote ${loteSeleccionado}...`);
      setCargando(true);
      setError(null);
      
      // Llamar al endpoint de actualización
      await climaServices.actualizarDatosLote(loteSeleccionado);
      console.log('✅ Medición creada en servidor');
      
      // Esperar un poco y recargar
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Hacer recarga limpia
      console.log('🔄 Recargando datos...');
      const datosResponse = await climaServices.obtenerDatosLote(loteSeleccionado);
      
      if (datosResponse.data && datosResponse.data.length > 0) {
        const ultimoDato = datosResponse.data[0];
        console.log(`✅ Datos recargados: ${ultimoDato.temperatura}°C, ${ultimoDato.irradiancia_solar} W/m²`);
        
        setDatosClima({
          temperatura: parseFloat(ultimoDato.temperatura || 0).toFixed(1),
          humedad: parseFloat(ultimoDato.humedad_relativa || 0).toFixed(1),
          irradiancia: parseFloat(ultimoDato.irradiancia_solar || 0).toFixed(1),
          nubosidad: parseFloat(ultimoDato.nubosidad || 0).toFixed(1),
          velocidad_viento: parseFloat(ultimoDato.velocidad_viento || 0).toFixed(1),
          precipitacion: parseFloat(ultimoDato.precipitacion || 0).toFixed(1),
          actualizacion: new Date().toLocaleTimeString('es-CO'),
          fuente: ultimoDato.fuente_datos || 'real',
          descripcion_clima: ultimoDato.descripcion_clima || 'Datos climáticos',
          ciudad: ultimoDato.ciudad || ultimoDato.lote_departamento || 'Ubicación'
        });
        setError(null);
      }
      
      // Trigger para recargar tabla histórica
      setActualizacionTrigger(prev => prev + 1);
    } catch (error) {
      console.error('❌ Error en actualización:', error.message);
      setError(`Error actualizando: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  const handleLoteChange = (event) => {
    const loteId = parseInt(event.target.value);
    setEsInicial(false);
    setLoteSeleccionado(loteId);
    console.log(`🔄 Lote seleccionado manualmente: ${loteId}`);
  };

  // Función antigua a eliminar (la hemos reemplazado)
  // const forzarActualizacionOpenWeatherInterno_VIEJA = async (loteId) => {

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
                {lote.nombre} - {lote.departamento}
              </option>
            ))}
          </select>

          <div className={styles.estadoActual}>
            <span className={styles.horaActual}>
              {datosClima ? `Actualizado: ${datosClima.actualizacion}` : 'Sin datos'}
            </span>
            <button
              className={styles.botonActualizar}
              onClick={actualizarDatos}
              disabled={cargando}
            >
              {cargando ? '🔄 Cargando...' : 'Actualizar'}
            </button>
          </div>
        </div>
      </header>

      {cargando && (
        <div className={styles.cargando}>
          ⏳ Obteniendo datos climáticos en tiempo real...
        </div>
      )}

      {error && !cargando && (
        <div className={styles.error}>
          ⚠️ {error}
          <button onClick={actualizarDatos}>Reintentar</button>
        </div>
      )}

      {datosClima && !cargando && !error && (
      <div className={styles.gridPrincipal}>
        {/* Sección Irradiancia Solar - PRINCIPAL */}
        <section className={styles.seccionTemperatura}>
          <div className={styles.tarjetaTemperatura}>
            <div className={styles.temperaturaHeader}>
              <h2>☀️ IRRADIANCIA SOLAR</h2>
            </div>
            <div className={styles.temperaturaValor}>
              {datosClima.irradiancia} W/m²
            </div>
            <div className={styles.fuenteDatos}>
              <small>
                {datosClima.fuente === 'openweather'
                  ? '✅ Datos en tiempo real'
                  : datosClima.fuente === 'ejemplo'
                  ? '⚠️ Datos de ejemplo'
                  : '📊 Datos reales'}
              </small>
            </div>
            <div className={styles.estadoRiesgo}>
              {datosClima.irradiancia > 800 ? '� Óptima' :
               datosClima.irradiancia > 500 ? '🟡 Media' : '� Baja'}
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
                <span className={styles.metricaLabel}>🌡️ Temperatura:</span>
                <span className={styles.metricaValor}>{datosClima.temperatura}°C</span>
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
              {datosClima.irradiancia > 800 && (
                <p>☀️ Irradiancia óptima - Condiciones ideales para el cultivo</p>
              )}
              {datosClima.irradiancia > 500 && datosClima.irradiancia <= 800 && (
                <p>� Irradiancia media - Monitorear estrés hídrico</p>
              )}
              {datosClima.irradiancia <= 500 && (
                <p>🔴 Irradiancia baja - Aumentar riego y verificar drenaje</p>
              )}
              {datosClima.humedad < 50 && (
                <p>💧 Humedad baja - Verificar sistema de riego</p>
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
      )}

      {/* Sección de Histórico de Mediciones */}
      <section className={styles.seccionHistorico}>
        <HistoricoMediciones 
          loteId={loteSeleccionado} 
          loteName={lotes.find(l => l.id === loteSeleccionado)?.nombre || 'Lote desconocido'}
          actualizarTrigger={actualizacionTrigger}
        />
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2024 Predicción de riesgo de café</p>
      </footer>
    </div>
  );
};

export default DashboardClima;