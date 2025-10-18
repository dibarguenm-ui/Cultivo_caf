import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './MapaPicker.module.css';

// Fijar iconos de Leaflet (problema común con React)
const defaultIcon = L.icon({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

/**
 * Componente que permite seleccionar ubicación en un mapa interactivo
 * y obtener automáticamente la altitud
 * ⚠️ El mapa está limitado solo a Colombia
 */
const MapaPicker = ({ onLocationSelected, initialLat, initialLng }) => {
  // 🇨🇴 Centro de Colombia
  const COLOMBIA_CENTER = [4.5709, -74.2973];

  const [position, setPosition] = useState(
    initialLat && initialLng ? [initialLat, initialLng] : COLOMBIA_CENTER
  );
  const [altitude, setAltitude] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Obtener altitud usando Open-Elevation API (gratuita)
   * API: https://open-elevation.com/
   */
  const fetchAltitude = async (lat, lng) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`
      );

      if (!response.ok) throw new Error('Error obteniendo altitud');

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const alt = Math.round(data.results[0].elevation);
        setAltitude(alt);

        // 🔄 Redondear coordenadas a 3 decimales
        const roundedLat = Math.round(lat * 1000) / 1000;
        const roundedLng = Math.round(lng * 1000) / 1000;

        // Notificar al componente padre
        if (onLocationSelected) {
          onLocationSelected({
            latitud: roundedLat,
            longitud: roundedLng,
            altitud: alt,
          });
        }
      } else {
        throw new Error('No se pudo determinar la altitud');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudo obtener la altitud. Intenta nuevamente.');
      setAltitude(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validar si una coordenada está dentro de Colombia
   * Límites mucho más ampliados para incluir todas las zonas (sur, amazonia, etc)
   */
  const isInColombia = (lat, lng) => {
    // Límites muy expandidos de Colombia (incluye toda la Amazonía y territorios)
    // Latitud: -4.2° (sur profundo) a 13.5° (norte)
    // Longitud: -81.0° (oeste) a -65.0° (este)
    return lat >= -4.2 && lat <= 13.5 && lng >= -81.0 && lng <= -65.0;
  };

  /**
   * Componente que captura clicks en el mapa
   */
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        
        // Validar que esté en Colombia
        if (!isInColombia(lat, lng)) {
          setError('⚠️ Por favor, selecciona una ubicación dentro de Colombia');
          setAltitude(null);
          return;
        }
        
        setPosition([lat, lng]);
        fetchAltitude(lat, lng);
      },
    });
    return null;
  };

  // Cargar altitud inicial si se proporciona ubicación
  useEffect(() => {
    if (initialLat && initialLng && !altitude) {
      fetchAltitude(initialLat, initialLng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.mapContainer}>
      <div className={styles.instructions}>
        <p>📍 Haz click en el mapa para seleccionar la ubicación exacta de tu cultivo</p>
      </div>

      <div className={styles.mapWrapper}>
        <MapContainer
          center={position}
          zoom={5}
          scrollWheelZoom={true}
          className={styles.map}
          maxZoom={18}
          minZoom={4}
          maxBounds={[[-6, -82], [15, -63]]}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {position && (
            <Marker position={position}>
              <Popup>
                <div>
                  <p><strong>Ubicación Seleccionada</strong></p>
                  <p>Lat: {position[0].toFixed(6)}</p>
                  <p>Lng: {position[1].toFixed(6)}</p>
                  {altitude && <p>Alt: {altitude} msnm</p>}
                  {loading && <p>🔄 Obteniendo altitud...</p>}
                </div>
              </Popup>
            </Marker>
          )}

          <MapClickHandler />
        </MapContainer>
      </div>

      <div className={styles.details}>
        {loading && (
          <div className={styles.loading}>
            <p>🔄 Obteniendo información de altitud...</p>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <p>❌ {error}</p>
          </div>
        )}

        {position && altitude && !loading && (
          <div className={styles.success}>
            <div className={styles.detailItem}>
              <label>Latitud:</label>
              <input type="text" value={position[0].toFixed(6)} readOnly />
            </div>
            <div className={styles.detailItem}>
              <label>Longitud:</label>
              <input type="text" value={position[1].toFixed(6)} readOnly />
            </div>
            <div className={styles.detailItem}>
              <label>Altitud (msnm):</label>
              <input type="text" value={altitude} readOnly className={styles.altitude} />
            </div>
            <p className={styles.successMessage}>✅ Ubicación y altitud detectadas correctamente</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapaPicker;
