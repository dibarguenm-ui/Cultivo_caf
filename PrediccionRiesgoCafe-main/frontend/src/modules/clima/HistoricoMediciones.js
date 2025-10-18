import React, { useState, useEffect } from 'react';
import climaServices from './api';
import styles from './HistoricoMediciones.module.css';

const HistoricoMediciones = ({ loteId, loteName, actualizarTrigger }) => {
  const [mediciones, setMediciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('7'); // días

  // Efecto para recargar cuando cambia loteId o filtro
  useEffect(() => {
    if (loteId) {
      cargarHistorico();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loteId, filtro]);

  // Efecto para recargar cuando se actualiza el trigger (después de actualizar datos)
  useEffect(() => {
    if (loteId && actualizarTrigger) {
      console.log('🔄 Recargando histórico debido a actualización de datos...');
      cargarHistorico();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualizarTrigger]);

  const cargarHistorico = async () => {
    try {
      setCargando(true);
      setError(null);

      console.log(`📊 Cargando histórico para lote ${loteId} - últimos ${filtro} días...`);
      
      const response = await climaServices.obtenerHistoricoLote(loteId, filtro);
      console.log('✅ Histórico obtenido:', response.data);
      console.log(`📊 Total registros recibidos: ${response.data.length}`);

      if (response.data && Array.isArray(response.data)) {
        console.log('Primeros 3 registros:');
        response.data.slice(0, 3).forEach((med, idx) => {
          console.log(`  ${idx+1}. ID: ${med.id}, Temp: ${med.temperatura}°C, Fecha: ${med.fecha_medicion}`);
        });
        
        // Filtrar localmente por fecha para garantizar que solo mostramos datos del período
        const ahora = new Date();
        const mañana = new Date(ahora.getTime() + 24 * 60 * 60 * 1000); // Incluye hasta mañana
        const diasAtras = new Date(ahora.getTime() - parseInt(filtro) * 24 * 60 * 60 * 1000);
        
        console.log(`📅 Filtro: desde ${diasAtras.toLocaleDateString()} hasta ${mañana.toLocaleDateString()}`);
        
        const medicionesFiltradas = response.data.filter(med => {
          // Usar fecha_medicion si existe, sino usar fecha_registro
          const fechaAUsar = med.fecha_medicion || med.fecha_registro;
          const fechaMed = new Date(fechaAUsar);
          return fechaMed >= diasAtras && fechaMed <= mañana;
        });
        
        // Ordenar por fecha descendente (más reciente primero)
        medicionesFiltradas.sort((a, b) => {
          const fechaA = new Date(a.fecha_medicion || a.fecha_registro);
          const fechaB = new Date(b.fecha_medicion || b.fecha_registro);
          return fechaB - fechaA;
        });
        
        console.log(`✅ Mediciones filtradas: ${medicionesFiltradas.length} de ${response.data.length}`);
        setMediciones(medicionesFiltradas);
      } else {
        console.warn('⚠️ response.data no es un array o está vacío');
        setMediciones([]);
      }
    } catch (err) {
      console.error('❌ Error cargando histórico:', err);
      setError(`Error al cargar histórico: ${err.message}`);
      setMediciones([]);
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fechaString) => {
    try {
      const fecha = new Date(fechaString);
      
      // Validar que la fecha sea válida
      if (isNaN(fecha.getTime())) {
        return 'Fecha inválida';
      }
      
      // Formato: DD/MM/YYYY, HH:MM:SS
      const dia = String(fecha.getDate()).padStart(2, '0');
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const año = fecha.getFullYear();
      const hora = String(fecha.getHours()).padStart(2, '0');
      const minuto = String(fecha.getMinutes()).padStart(2, '0');
      const segundo = String(fecha.getSeconds()).padStart(2, '0');
      
      return `${dia}/${mes}/${año}, ${hora}:${minuto}:${segundo}`;
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Error en fecha';
    }
  };

  const obtenerEstadoIrradiancia = (irradiancia) => {
    const valor = parseFloat(irradiancia);
    if (valor > 800) return '🟢 Óptima';
    if (valor > 500) return '🟡 Media';
    return '🔴 Baja';
  };

  const obtenerEstadoHumedad = (humedad) => {
    const valor = parseFloat(humedad);
    if (valor > 85) return '🔵 Alta';
    if (valor > 60) return '🟢 Normal';
    if (valor > 40) return '🟡 Baja';
    return '🔴 Muy Baja';
  };

  const obtenerEstadoTemperatura = (temperatura) => {
    const valor = parseFloat(temperatura);
    if (valor > 35) return '🔴 Muy Caliente';
    if (valor > 30) return '🟡 Caliente';
    if (valor > 15) return '🟢 Normal';
    return '🔵 Frío';
  };

  const descargarCSV = () => {
    if (mediciones.length === 0) {
      alert('No hay datos para descargar');
      return;
    }

    const headers = [
      'Fecha y Hora',
      'Irradiancia (W/m²)',
      'Temperatura (°C)',
      'Humedad (%)',
      'Nubosidad (%)',
      'Precipitación (mm)',
      'Viento (m/s)',
      'Fuente de Datos'
    ];

    const rows = mediciones.map(med => [
      formatearFecha(med.fecha_medicion),
      med.irradiancia_solar,
      med.temperatura,
      med.humedad_relativa,
      med.nubosidad || '--',
      med.precipitacion || '--',
      med.velocidad_viento || '--',
      med.fuente_datos
    ]);

    const csv = [
      [
        `Histórico de Mediciones - ${loteName}`,
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ],
      [
        `Descargado: ${new Date().toLocaleString('es-CO')}`,
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ],
      [],
      headers,
      ...rows
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historico_clima_${loteName}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!loteId) {
    return (
      <div className={styles.contenedor}>
        <div className={styles.mensajeVacio}>
          <p>Selecciona un lote para ver el histórico de mediciones</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.contenedor}>
      <div className={styles.encabezado}>
        <h2>📊 Histórico de Mediciones - {loteName}</h2>
        <div className={styles.controles}>
          <select
            className={styles.selectFiltro}
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            disabled={cargando}
          >
            <option value="1">Último día</option>
            <option value="7">Últimos 7 días</option>
            <option value="15">Últimos 15 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </select>

          <button
            className={styles.botonDescargar}
            onClick={descargarCSV}
            disabled={cargando || mediciones.length === 0}
            title="Descargar datos como CSV"
          >
            📥 Descargar CSV
          </button>

          <button
            className={styles.botonRecargar}
            onClick={cargarHistorico}
            disabled={cargando}
            title="Recargar datos"
          >
            {cargando ? '🔄 Cargando...' : '🔄 Recargar'}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <p>⚠️ {error}</p>
        </div>
      )}

      {cargando && (
        <div className={styles.cargando}>
          <p>Cargando histórico de mediciones...</p>
        </div>
      )}

      {!cargando && mediciones.length === 0 && (
        <div className={styles.mensajeVacio}>
          <p>No hay mediciones disponibles para este período</p>
        </div>
      )}

      {!cargando && mediciones.length > 0 && (
        <div className={styles.tablaContenedor}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>☀️ Irradiancia</th>
                <th>🌡️ Temperatura</th>
                <th>💧 Humedad</th>
                <th>☁️ Nubosidad</th>
                <th>🌧️ Precipitación</th>
                <th>💨 Viento</th>
                <th>📡 Fuente</th>
              </tr>
            </thead>
            <tbody>
              {mediciones.map((medicion, index) => (
                <tr key={index} className={styles.fila}>
                  <td className={styles.fecha}>
                    {formatearFecha(medicion.fecha_medicion)}
                  </td>
                  <td className={styles.irradiancia}>
                    <span className={styles.estado}>
                      {obtenerEstadoIrradiancia(medicion.irradiancia_solar)}
                    </span>
                    <span className={styles.valor}>
                      {parseFloat(medicion.irradiancia_solar).toFixed(1)} W/m²
                    </span>
                  </td>
                  <td className={styles.temperatura}>
                    <span className={styles.estado}>
                      {obtenerEstadoTemperatura(medicion.temperatura)}
                    </span>
                    <span className={styles.valor}>
                      {parseFloat(medicion.temperatura).toFixed(1)}°C
                    </span>
                  </td>
                  <td className={styles.humedad}>
                    <span className={styles.estado}>
                      {obtenerEstadoHumedad(medicion.humedad_relativa)}
                    </span>
                    <span className={styles.valor}>
                      {parseFloat(medicion.humedad_relativa).toFixed(1)}%
                    </span>
                  </td>
                  <td className={styles.nubosidad}>
                    {medicion.nubosidad !== null
                      ? `${parseFloat(medicion.nubosidad).toFixed(1)}%`
                      : '--'}
                  </td>
                  <td className={styles.precipitacion}>
                    {medicion.precipitacion !== null
                      ? `${parseFloat(medicion.precipitacion).toFixed(2)} mm`
                      : '--'}
                  </td>
                  <td className={styles.viento}>
                    {medicion.velocidad_viento !== null
                      ? `${parseFloat(medicion.velocidad_viento).toFixed(2)} m/s`
                      : '--'}
                  </td>
                  <td className={styles.fuente}>
                    {medicion.fuente_datos === 'nasa_power' ? '🛰️ NASA' : '📊 Manual'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.estadisticas}>
            <p>
              📈 Mostrando {mediciones.length} mediciones
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricoMediciones;
