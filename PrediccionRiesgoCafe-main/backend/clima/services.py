import requests
from django.conf import settings
from decimal import Decimal
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class ServicioDatosClimaticos:
    def __init__(self):
        # ✅ TU API KEY REAL DE OPENWEATHER
        self.openweather_key = "444f62b46b4300c81cd965ba1ebc766c"

    def obtener_datos_actuales(self, lote):
        """Obtiene datos climáticos REALES en tiempo real de OpenWeather"""
        # Obtener coordenadas según el municipio del lote
        latitud, longitud = self._obtener_coordenadas_reales(lote.municipio)

        print(f"📍 Consultando clima real para: {lote.municipio} ({latitud}, {longitud})")

        # Intentar obtener datos REALES de OpenWeather
        datos_reales = self._obtener_openweather_real(latitud, longitud)

        if datos_reales:
            print(f"✅ DATOS REALES OBTENIDOS: {datos_reales['temperatura']}°C, {datos_reales['humedad_relativa']}% humedad")
            return datos_reales
        else:
            print("⚠️ Fallback a datos realistas de Colombia")
            return self._obtener_datos_realistas_colombia(lote.municipio)

    def _obtener_coordenadas_reales(self, municipio):
        """Coordenadas reales de municipios cafeteros colombianos"""
        coordenadas_colombia = {
            'Medellín': (6.2442, -75.5812),
            'Antioquia': (6.2442, -75.5812),
            'Caldas': (5.0586, -75.4915),
            'Manizales': (5.0689, -75.5174),
            'Huila': (2.5359, -75.5277),
            'Neiva': (2.9345, -75.2809),
            'Quindío': (4.4610, -75.6674),
            'Armenia': (4.5370, -75.6751),
            'Risaralda': (5.0900, -75.8700),
            'Pereira': (4.8087, -75.6906),
            'Bello': (6.3386, -75.5621),
            'Itagüí': (6.1726, -75.6096),
            'Envigado': (6.1696, -75.5872),
            'Cundinamarca': (4.5981, -74.0758),
            'Bogotá': (4.7110, -74.0721),
            'Boyacá': (5.4545, -73.3620),
            'Santander': (6.6437, -73.1331)
        }
        return coordenadas_colombia.get(municipio, (6.2442, -75.5812))  # Medellín por defecto

    def _obtener_openweather_real(self, latitud, longitud):
        """Obtiene datos REALES en tiempo real de OpenWeatherMap"""
        try:
            url = "https://api.openweathermap.org/data/2.5/weather"
            params = {
                'lat': latitud,
                'lon': longitud,
                'appid': self.openweather_key,  # ✅ TU KEY FUNCIONANDO
                'units': 'metric',  # Celsius
                'lang': 'es'  # Español
            }

            print(f"🌐 Conectando con OpenWeather API...")
            response = requests.get(url, params=params, timeout=15)

            if response.status_code == 200:
                data = response.json()
                ciudad = data.get('name', 'Ubicación')
                clima = data['weather'][0]['description'] if data.get('weather') else 'Desconocido'

                print(f"✅ CLIMA REAL: {ciudad} - {clima}")
                print(f"   🌡️ Temp: {data['main']['temp']}°C")
                print(f"   💧 Humedad: {data['main']['humidity']}%")
                print(f"   ☁️ Nubes: {data.get('clouds', {}).get('all', 0)}%")

                return {
                    'temperatura': Decimal(str(round(data['main']['temp'], 1))),
                    'humedad_relativa': Decimal(str(data['main']['humidity'])),
                    'presion_atmosferica': Decimal(str(data['main']['pressure'])),
                    'nubosidad': Decimal(str(data.get('clouds', {}).get('all', 0))),
                    'velocidad_viento': Decimal(str(round(data.get('wind', {}).get('speed', 0), 1))),
                    'irradiancia_solar': self._calcular_irradiancia_real(data),
                    'precipitacion': Decimal(str(round(data.get('rain', {}).get('1h', 0), 1))),
                    'fuente_datos': 'openweather_real',
                    'fecha_medicion': datetime.now(),
                    'calidad_datos': 'alta',
                    'descripcion_clima': clima,
                    'ciudad': ciudad
                }
            else:
                print(f"❌ Error API OpenWeather: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return None

        except Exception as e:
            print(f"❌ Error de conexión: {e}")
            return None

    def _calcular_irradiancia_real(self, weather_data):
        """Calcula irradiancia solar basada en datos reales"""
        try:
            nubosidad = weather_data.get('clouds', {}).get('all', 50)
            hora_actual = datetime.now().hour

            # Factor horario (máximo al mediodía)
            if 6 <= hora_actual <= 18:
                hora_pico = 12
                factor_horario = 1 - abs(hora_actual - hora_pico) / 6
                factor_horario = max(0.3, factor_horario)
            else:
                factor_horario = 0.1

            # Ajustar por nubosidad
            factor_nubosidad = (100 - nubosidad) / 100

            # Irradiancia máxima en Colombia
            irradiancia_maxima = 1000
            irradiancia_calculada = irradiancia_maxima * factor_horario * factor_nubosidad

            return Decimal(str(round(irradiancia_calculada, 1)))

        except Exception as e:
            print(f"Error cálculo irradiancia: {e}")
            return Decimal('800.0')

    def _obtener_datos_realistas_colombia(self, municipio):
        """Fallback con datos realistas si falla la API"""
        from datetime import datetime
        import random

        hora_actual = datetime.now().hour

        # Datos basados en ubicaciones reales
        zonas_cafeteras = {
            'Medellín': {'temp_base': 22, 'hum_base': 75},
            'Antioquia': {'temp_base': 22, 'hum_base': 75},
            'Caldas': {'temp_base': 18, 'hum_base': 80},
            'Manizales': {'temp_base': 18, 'hum_base': 80},
            'Huila': {'temp_base': 26, 'hum_base': 70},
            'Neiva': {'temp_base': 28, 'hum_base': 65},
        }

        zona = zonas_cafeteras.get(municipio, zonas_cafeteras['Medellín'])

        # Variación horaria
        if 12 <= hora_actual <= 15:
            temp_var = 4
            irradiancia = 850
        elif 9 <= hora_actual <= 11:
            temp_var = 2
            irradiancia = 750
        else:
            temp_var = -2
            irradiancia = 400

        return {
            'temperatura': Decimal(str(round(zona['temp_base'] + temp_var, 1))),
            'humedad_relativa': Decimal(str(round(zona['hum_base'], 1))),
            'irradiancia_solar': Decimal(str(round(irradiancia, 1))),
            'nubosidad': Decimal('45.0'),
            'precipitacion': Decimal('0.0'),
            'presion_atmosferica': Decimal('1013.0'),
            'velocidad_viento': Decimal('2.5'),
            'fuente_datos': 'simulacion_colombia',
            'fecha_medicion': datetime.now(),
            'calidad_datos': 'media',
            'descripcion_clima': 'Parcialmente nublado',
            'ciudad': municipio
        }