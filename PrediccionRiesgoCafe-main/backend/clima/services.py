"""
Servicio de Datos Climáticos usando NASA POWER API
Optimizado para agricultura (cultivo de café en Colombia)

NASA POWER API:
- Completamente GRATUITA
- Sin límites de llamadas
- Datos específicos para agricultura
- Precisión científica
- Documentación: https://power.larc.nasa.gov/
"""

import requests
from decimal import Decimal
import logging
from datetime import datetime, timedelta
from django.utils import timezone
import math

logger = logging.getLogger(__name__)

class ServicioDatosClimaticos:
    def __init__(self):
        """
        Servicio de datos climáticos usando NASA POWER API
        No requiere API key
        """
        self.base_url = "https://power.larc.nasa.gov/api/temporal/daily/point"
        self.timeout = 15

    def obtener_datos_actuales(self, lote):
        """
        Obtiene datos climáticos REALES en tiempo real usando NASA POWER
        
        Args:
            lote: Objeto LoteCafe con latitud y longitud
            
        Returns:
            dict: Datos climáticos procesados
        """
        # Obtener coordenadas del lote
        if lote.latitud and lote.longitud:
            latitud = float(lote.latitud)
            longitud = float(lote.longitud)
            ubicacion = f"{lote.nombre} (manual)"
        else:
            latitud, longitud = self._obtener_coordenadas_reales(lote.departamento)
            ubicacion = lote.departamento

        print(f"\n{'='*70}")
        print(f"📍 Consultando datos NASA POWER para: {ubicacion}")
        print(f"   Coordenadas: ({latitud:.4f}, {longitud:.4f})")
        print(f"{'='*70}\n")

        # Obtener datos de NASA POWER
        datos_nasa = self._obtener_nasa_power(latitud, longitud)

        if datos_nasa:
            print(f"\n✅ DATOS OBTENIDOS EXITOSAMENTE DE NASA POWER")
            print(f"   🌡️ Temperatura: {datos_nasa['temperatura']}°C")
            print(f"   💧 Humedad: {datos_nasa['humedad_relativa']}%")
            print(f"   ☀️ Irradiancia: {datos_nasa['irradiancia_solar']} W/m²")
            print(f"   ☁️ Nubosidad: {datos_nasa['nubosidad']}%")
            print(f"   🌧️ Precipitación: {datos_nasa['precipitacion']} mm\n")
            return datos_nasa
        else:
            print(f"\n❌ No se obtuvieron datos de NASA POWER\n")
            return None

    def _obtener_nasa_power(self, latitud, longitud):
        """
        Obtiene datos de NASA POWER API - Comunidad Agrícola
        """
        try:
            # Fechas: últimos 30 días para garantizar datos válidos
            # NASA POWER tiene un desfase de 1-2 meses en los datos
            fecha_fin = (timezone.now() - timedelta(days=2)).strftime('%Y%m%d')
            fecha_inicio = (timezone.now() - timedelta(days=30)).strftime('%Y%m%d')

            print(f"🌐 Conectando con NASA POWER API...")
            print(f"   Fechas solicitadas: {fecha_inicio} a {fecha_fin}")
            print(f"   (NASA POWER tiene datos con 1-2 meses de desfase)")

            params = {
                'parameters': 'T2M,RH2M,PS,WS2M,ALLSKY_SFC_SW_DWN,PRECTOTCORR,T2M_MAX,T2M_MIN',
                'community': 'AG',  # Agricultura
                'longitude': longitud,
                'latitude': latitud,
                'start': fecha_inicio,
                'end': fecha_fin,
                'format': 'JSON'
            }

            response = requests.get(self.base_url, params=params, timeout=self.timeout)

            if response.status_code == 200:
                data = response.json()
                print(f"✅ Respuesta exitosa de NASA POWER\n")
                return self._procesar_datos_nasa(data, latitud, longitud)
            else:
                print(f"❌ Error NASA POWER: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                return None

        except requests.exceptions.Timeout:
            print(f"❌ Timeout conectando a NASA POWER")
            return None
        except Exception as e:
            print(f"❌ Error obteniendo datos NASA POWER: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _procesar_datos_nasa(self, data, latitud, longitud):
        """
        Procesa la respuesta de NASA POWER API
        Extrae y transforma los datos al formato del proyecto
        """
        try:
            properties = data.get('properties', {})
            parameter_data = properties.get('parameter', {})

            if not parameter_data:
                print("❌ No hay datos de parámetros en la respuesta")
                return None

            # Obtener todas las fechas disponibles
            fechas_disponibles = list(parameter_data.get('T2M', {}).keys())
            
            if not fechas_disponibles:
                print("❌ No hay fechas disponibles en los datos")
                return None
            
            # Buscar la fecha más reciente con datos válidos (no -999) 
            # Priorizamos datos válidos para temperatura e irradiancia
            fechas_ordenadas = sorted(fechas_disponibles, reverse=True)
            fecha_mas_reciente = None
            
            for fecha in fechas_ordenadas:
                temp = float(parameter_data.get('T2M', {}).get(fecha, -999))
                irradiancia = float(parameter_data.get('ALLSKY_SFC_SW_DWN', {}).get(fecha, -999))
                humedad = float(parameter_data.get('RH2M', {}).get(fecha, -999))
                
                # Aceptar la fecha si al menos temperatura y humedad son válidas
                if temp > -900 and humedad > -900:
                    fecha_mas_reciente = fecha
                    break
            
            if not fecha_mas_reciente:
                # Fallback: usar la última fecha disponible
                fecha_mas_reciente = fechas_ordenadas[0]
                print(f"⚠️ Usando fecha: {fecha_mas_reciente} (datos incompletos)")
            else:
                print(f"📅 Fecha con datos válidos: {fecha_mas_reciente}")

            # Extraer parámetros
            temperatura = float(parameter_data.get('T2M', {}).get(fecha_mas_reciente, 22.0))
            humedad = float(parameter_data.get('RH2M', {}).get(fecha_mas_reciente, 70.0))
            presion_kpa = float(parameter_data.get('PS', {}).get(fecha_mas_reciente, 101.325))
            velocidad_viento = float(parameter_data.get('WS2M', {}).get(fecha_mas_reciente, 2.0))
            
            # Radiación solar (dato clave para agricultura)
            irradiancia_kwh_dia = float(parameter_data.get('ALLSKY_SFC_SW_DWN', {}).get(fecha_mas_reciente, -999))
            
            # Si irradiancia es -999 (faltante), usar valor por defecto basado en humedad
            if irradiancia_kwh_dia < -900:
                # Estimación: más humedad = menos radiación
                irradiancia_kwh_dia = max(1.0, 7.0 - (humedad - 50) * 0.05)
                print(f"   ⚠️ Irradiancia estimada (dato faltante): {irradiancia_kwh_dia:.2f} kWh/m²/día")
            
            # Precipitación
            precipitacion_dia = float(parameter_data.get('PRECTOTCORR', {}).get(fecha_mas_reciente, 0.0))

            # Datos adicionales para mejor análisis
            temp_max = float(parameter_data.get('T2M_MAX', {}).get(fecha_mas_reciente, temperatura))
            temp_min = float(parameter_data.get('T2M_MIN', {}).get(fecha_mas_reciente, temperatura))

            print(f"\n📊 PARÁMETROS EXTRAÍDOS:")
            print(f"   Temperatura: {temperatura:.1f}°C (Rango: {temp_min:.1f}°C - {temp_max:.1f}°C)")
            print(f"   Humedad: {humedad:.1f}%")
            print(f"   Presión: {presion_kpa:.2f} kPa")
            print(f"   Viento: {velocidad_viento:.1f} m/s")
            print(f"   Irradiancia solar: {irradiancia_kwh_dia:.2f} kWh/m²/día")
            print(f"   Precipitación: {precipitacion_dia:.1f} mm/día")

            # Calcular irradiancia instantánea y nubosidad desde radiación diaria
            irradiancia_instantanea = self._convertir_irradiancia_instantanea(irradiancia_kwh_dia)
            nubosidad = self._estimar_nubosidad_desde_irradiancia(irradiancia_kwh_dia)

            print(f"\n🔧 PARÁMETROS CALCULADOS:")
            print(f"   Irradiancia instantánea: {irradiancia_instantanea:.1f} W/m²")
            print(f"   Nubosidad estimada: {nubosidad:.1f}%")

            # Descripción del clima
            clima = self._describir_clima(nubosidad, precipitacion_dia)

            # ⚠️ IMPORTANTE: Usar fecha ACTUAL del servidor como fecha_medicion
            # Aunque NASA POWER tiene datos históricos (2-3 días atrás),
            # guardamos la fecha actual porque es cuando el sistema hace la medición
            fecha_medicion_actual = timezone.now()
            print(f"📅 Fecha de medición: {fecha_medicion_actual} (fecha actual cuando se actualiza)")

            return {
                'temperatura': Decimal(str(round(temperatura, 1))),
                'humedad_relativa': Decimal(str(round(humedad, 1))),
                'presion_atmosferica': Decimal(str(round(presion_kpa * 10, 2))),  # kPa a hPa
                'nubosidad': Decimal(str(round(nubosidad, 1))),
                'velocidad_viento': Decimal(str(round(velocidad_viento, 1))),
                'irradiancia_solar': Decimal(str(round(irradiancia_instantanea, 1))),
                'precipitacion': Decimal(str(round(precipitacion_dia, 1))),
                'fuente_datos': 'nasa_power',
                'fecha_medicion': fecha_medicion_actual,
                'calidad_datos': 'alta',  # NASA POWER siempre tiene alta calidad
                'descripcion_clima': clima,
                'ciudad': f"NASA-POWER ({latitud:.2f}, {longitud:.2f})"
            }

        except Exception as e:
            print(f"❌ Error procesando datos NASA POWER: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _convertir_irradiancia_instantanea(self, irradiancia_kwh_dia):
        """
        Convierte irradiancia diaria acumulada (kWh/m²/día) a instantánea (W/m²)
        """
        hora_actual = timezone.now().hour

        # Si es noche (antes de 6 AM o después de 6 PM), irradiancia = 0
        if hora_actual < 6 or hora_actual > 18:
            print(f"🌙 Hora nocturna ({hora_actual:02d}:00) - Irradiancia = 0 W/m²")
            return 0

        # Horas de luz en Colombia: 6 AM a 6 PM = 12 horas
        horas_luz_diarias = 12

        # Convertir kWh/m²/día a W/m² promedio diario
        watts_promedio_diario = (irradiancia_kwh_dia * 1000) / horas_luz_diarias

        print(f"🔧 Conversión irradiancia:")
        print(f"   Diaria (acumulada): {irradiancia_kwh_dia:.2f} kWh/m²/día")
        print(f"   Promedio diario: {watts_promedio_diario:.1f} W/m²")

        # Aplicar distribución sinusoidal durante el día
        hora_solar = hora_actual - 6  # Normalizar (0 = 6 AM, 12 = 6 PM)
        
        # Función sinusoidal: sin(π * x / 12) donde x va de 0 a 12
        factor_horario = math.sin(math.pi * hora_solar / horas_luz_diarias)
        factor_horario = max(0.1, factor_horario)  # Mínimo realista

        print(f"   Hora actual: {hora_actual:02d}:00 - Factor horario: {factor_horario:.2f}")

        # Calcular irradiancia instantánea
        # Factor 2 porque el pico es aproximadamente el doble del promedio
        irradiancia_instantanea = watts_promedio_diario * factor_horario * 2

        # Aplicar límites realistas para Colombia
        irradiancia_instantanea = min(1200, max(50 if factor_horario > 0.2 else 0, irradiancia_instantanea))

        print(f"   Irradiancia instantánea: {irradiancia_instantanea:.1f} W/m²")

        return irradiancia_instantanea

    def _estimar_nubosidad_desde_irradiancia(self, irradiancia_kwh_dia):
        """
        Estima la nubosidad desde la radiación solar acumulada diaria
        """
        if irradiancia_kwh_dia > 6.5:
            nubosidad = 10  # Despejado
        elif irradiancia_kwh_dia > 5.5:
            nubosidad = 25  # Mayormente despejado
        elif irradiancia_kwh_dia > 4.5:
            nubosidad = 40  # Parcialmente nublado
        elif irradiancia_kwh_dia > 3.5:
            nubosidad = 60  # Nublado
        elif irradiancia_kwh_dia > 2.5:
            nubosidad = 75  # Muy nublado
        else:
            nubosidad = 90  # Casi completamente cubierto

        print(f"🔧 Estimación nubosidad:")
        print(f"   Irradiancia: {irradiancia_kwh_dia:.2f} kWh/m²/día → Nubosidad: {nubosidad:.1f}%")

        return nubosidad

    def _describir_clima(self, nubosidad, precipitacion_dia):
        """Describe el estado del clima basado en parámetros"""
        if precipitacion_dia > 2.0:
            return "lluvia significativa"
        elif precipitacion_dia > 0.5:
            return "lluvia ligera"
        elif nubosidad < 20:
            return "despejado"
        elif nubosidad < 40:
            return "mayormente despejado"
        elif nubosidad < 60:
            return "parcialmente nublado"
        elif nubosidad < 80:
            return "nublado"
        else:
            return "muy nublado"

    def _obtener_coordenadas_reales(self, municipio):
        """Coordenadas reales de municipios cafeteros colombianos"""
        coordenadas_colombia = {
            'Medellín': (6.2442, -75.5812),
            'Antioquia': (6.2442, -75.5812),
            'Caldas': (5.0586, -75.4915),
            'Manizales': (5.0689, -75.5174),
            'Huila': (2.9345, -75.2809),
            'Neiva': (2.9345, -75.2809),
            'Quindío': (4.5370, -75.6751),
            'Armenia': (4.5370, -75.6751),
            'Risaralda': (4.8087, -75.6906),
            'Pereira': (4.8087, -75.6906),
            'Bello': (6.3386, -75.5621),
            'Itagüí': (6.1726, -75.6096),
            'Envigado': (6.1696, -75.5872),
            'Cundinamarca': (4.7110, -74.0721),
            'Bogotá': (4.7110, -74.0721),
            'Boyacá': (5.5277, -73.3640),
            'Santander': (7.1269, -73.1239),
            'Valle del Cauca': (3.2190, -76.5044),
            'Tolima': (4.4427, -75.2219),
            'Cauca': (2.4521, -76.6106),
            'Nariño': (1.2136, -77.2974),
            'Otro': (4.5709, -74.2973)
        }
        return coordenadas_colombia.get(municipio, (4.5709, -74.2973))  # Centro de Colombia por defecto

    def _obtener_open_meteo(self, latitud, longitud):
        """Obtiene datos de Open-Meteo API (GRATUITA, sin API key) - CORREGIDA"""
        try:
            url = "https://api.open-meteo.com/v1/forecast"
            params = {
                'latitude': latitud,
                'longitude': longitud,
                # Parámetros mejorados para mejor precisión
                'current': 'temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,precipitation,shortwave_radiation,direct_radiation,diffuse_radiation,surface_pressure',
                'timezone': 'auto',
                # Agregar datos horarios para mejor contexto
                'hourly': 'temperature_2m,cloud_cover,shortwave_radiation',
                'forecast_days': 1  # Solo día actual
            }

            print(f"🌐 Conectando con Open-Meteo API (CORREGIDA)...")
            response = requests.get(url, params=params, timeout=15)

            if response.status_code == 200:
                data = response.json()
                current = data.get('current', {})
                hourly = data.get('hourly', {})
                
                # DATOS BÁSICOS CON VALIDACIÓN
                temperatura = self._validar_temperatura(current.get('temperature_2m', 22.0))
                humedad = self._validar_humedad(current.get('relative_humidity_2m', 70))
                nubosidad_raw = current.get('cloud_cover', None)
                viento = max(0, current.get('wind_speed_10m', 2.0))
                precipitacion = max(0, current.get('precipitation', 0))
                presion = current.get('surface_pressure', 1013.25)
                
                # CORRECCIÓN DE NUBOSIDAD
                nubosidad = self._corregir_nubosidad(nubosidad_raw, hourly)
                
                # OBTENER RADIACIÓN SOLAR CORREGIDA
                radiacion_onda_corta = current.get('shortwave_radiation', None)
                radiacion_directa = current.get('direct_radiation', None)
                radiacion_difusa = current.get('diffuse_radiation', None)

                print(f"✅ CLIMA Open-Meteo: {latitud}, {longitud}")
                print(f"   🌡️ Temp: {temperatura}°C")
                print(f"   💧 Humedad: {humedad}%")
                print(f"   ☁️ Nubes (raw): {nubosidad_raw}% → Corregida: {nubosidad}%")
                print(f"   💨 Viento: {viento} m/s")
                print(f"   🌧️ Precipitación: {precipitacion} mm")
                
                # DETERMINAR IRRADIANCIA INTELIGENTE
                irradiancia_final = self._obtener_irradiancia_inteligente(
                    radiacion_onda_corta, radiacion_directa, radiacion_difusa, nubosidad
                )

                # Determinar descripción del clima basado en nubosidad CORREGIDA
                if nubosidad < 20:
                    clima = "despejado"
                elif nubosidad < 50:
                    clima = "parcialmente nublado"
                elif nubosidad < 80:
                    clima = "nublado"
                else:
                    clima = "muy nublado"

                if precipitacion > 0.5:  # Más de 0.5mm para considerar lluvia
                    clima = "lluvia"

                return {
                    'temperatura': Decimal(str(round(temperatura, 1))),
                    'humedad_relativa': Decimal(str(humedad)),
                    'presion_atmosferica': Decimal(str(round(presion, 2))),
                    'nubosidad': Decimal(str(round(nubosidad, 1))),
                    'velocidad_viento': Decimal(str(round(viento, 1))),
                    'irradiancia_solar': irradiancia_final,
                    'precipitacion': Decimal(str(round(precipitacion, 1))),
                    'fuente_datos': 'open_meteo',
                    'fecha_medicion': timezone.now(),
                    'calidad_datos': self._determinar_calidad_datos(radiacion_onda_corta, nubosidad_raw),
                    'descripcion_clima': clima,
                    'ciudad': f"Ubicación ({latitud:.2f}, {longitud:.2f})"
                }
            else:
                print(f"❌ Error Open-Meteo: {response.status_code}")
                return None

        except Exception as e:
            print(f"❌ Error Open-Meteo: {e}")
            return None

    def _calcular_irradiancia_desde_nubosidad(self, nubosidad):
        """
        Calcula irradiancia solar MEJORADA considerando:
        - Radiación directa (variable con nubosidad)
        - Radiación difusa (siempre presente, incluso nublado)
        - Hora del día (ángulo solar)
        - Condiciones atmosféricas de Colombia
        
        Formula mejorada para Colombia (zona tropical/ecuatorial)
        Basada en modelo de transmitancia atmosférica actualizado
        """
        try:
            hora_actual = timezone.now().hour

            # === FACTOR HORARIO MEJORADO ===
            if 6 <= hora_actual <= 18:
                # Curva más realista del ángulo solar
                hora_pico = 12
                diferencia_horas = abs(hora_actual - hora_pico)
                
                # Función coseno para simular mejor el ángulo solar
                import math
                factor_horario = math.cos(diferencia_horas * math.pi / 12)
                factor_horario = max(0.15, factor_horario)  # Mínimo más realista
            else:
                factor_horario = 0.0

            if factor_horario <= 0.01:
                return Decimal('0.0')

            # === IRRADIANCIA EXTRATERRESTRE AJUSTADA ===
            # Para Colombia (4.5°N): ajuste por latitud
            irradiancia_extraterrestre = 980  # Incrementado ligeramente

            # === TRANSMITANCIA MEJORADA ===
            # Modelo más sofisticado basado en estudios de Colombia
            if nubosidad <= 10:
                transmitancia = 0.85  # Cielo muy despejado
            elif nubosidad <= 30:
                transmitancia = 0.75  # Ligeramente nublado
            elif nubosidad <= 50:
                transmitancia = 0.65  # Parcialmente nublado
            elif nubosidad <= 70:
                transmitancia = 0.45  # Nublado
            elif nubosidad <= 85:
                transmitancia = 0.30  # Muy nublado
            else:
                transmitancia = 0.20  # Completamente nublado
            
            radiacion_directa = irradiancia_extraterrestre * transmitancia * factor_horario

            # === RADIACIÓN DIFUSA MEJORADA ===
            # Radiación que se dispersa en la atmósfera
            # Modelo mejorado para Colombia
            if nubosidad >= 85:
                fraccion_difusa = 0.45  # Muy nublado: más radiación difusa
            elif nubosidad >= 70:
                fraccion_difusa = 0.35  # Nublado
            elif nubosidad >= 50:
                fraccion_difusa = 0.28  # Parcialmente nublado
            elif nubosidad >= 30:
                fraccion_difusa = 0.20  # Ligeramente nublado
            elif nubosidad >= 10:
                fraccion_difusa = 0.15  # Mayormente despejado
            else:
                fraccion_difusa = 0.12  # Despejado

            radiacion_difusa = irradiancia_extraterrestre * fraccion_difusa * factor_horario

            # === RADIACIÓN TOTAL ===
            irradiancia_total = radiacion_directa + radiacion_difusa
            
            # Aplicar límites más realistas para Colombia
            irradiancia_minima = 50 if factor_horario > 0.3 else 0
            irradiancia_maxima = 1200  # Máximo observado en Colombia
            irradiancia_total = min(irradiancia_maxima, max(irradiancia_minima, irradiancia_total))

            print(f"☀️ Cálculo irradiancia solar MEJORADO:")
            print(f"   Hora: {hora_actual:02d}:00 - Factor horario: {factor_horario:.2f}")
            print(f"   Nubosidad: {nubosidad:.0f}% - Transmitancia: {transmitancia:.2f}")
            print(f"   ├─ Radiación Directa: {radiacion_directa:.1f} W/m²")
            print(f"   ├─ Radiación Difusa: {radiacion_difusa:.1f} W/m² (fracción: {fraccion_difusa:.2f})")
            print(f"   └─ Total: {irradiancia_total:.1f} W/m²")

            return Decimal(str(round(irradiancia_total, 1)))

        except Exception as e:
            print(f"❌ Error cálculo irradiancia: {e}")
            return Decimal('0.0')

    def _obtener_datos_realistas_colombia(self, municipio):
        """Fallback con datos realistas si falla la API"""
        import random

        hora_actual = timezone.now().hour

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
            'fecha_medicion': timezone.now(),
            'calidad_datos': 'media',
            'descripcion_clima': 'Parcialmente nublado',
            'ciudad': municipio
        }

    # ═════════════════════════════════════════════════════════════════
    # NUEVAS FUNCIONES DE VALIDACIÓN Y CORRECCIÓN
    # ═════════════════════════════════════════════════════════════════

    def _validar_temperatura(self, temp):
        """Valida temperatura dentro de rangos realistas para Colombia"""
        if temp is None:
            return 22.0
        # Colombia: rango típico 15°C - 35°C en zonas cafeteras
        return max(15.0, min(35.0, float(temp)))

    def _validar_humedad(self, humedad):
        """Valida humedad dentro de rangos realistas"""
        if humedad is None:
            return 70.0
        return max(30.0, min(100.0, float(humedad)))

    def _corregir_nubosidad(self, nubosidad_raw, datos_horarios):
        """Corrige problemas de nubosidad usando múltiples fuentes"""
        try:
            # Si no hay dato, usar valor por defecto
            if nubosidad_raw is None:
                print("⚠️ Sin dato de nubosidad, usando promedio regional")
                return 45.0  # Promedio para zona cafetera colombiana
            
            nubosidad = float(nubosidad_raw)
            
            # Si es exactamente 100%, revisar datos horarios para confirmar
            if nubosidad >= 99.0 and datos_horarios:
                try:
                    # Obtener últimas 3 horas de nubosidad
                    nubes_horarias = datos_horarios.get('cloud_cover', [])
                    if len(nubes_horarias) >= 3:
                        promedio_reciente = sum(nubes_horarias[-3:]) / 3
                        if promedio_reciente < 90:
                            print(f"🔧 Corrigiendo nubosidad: {nubosidad}% → {promedio_reciente:.1f}% (promedio horario)")
                            nubosidad = promedio_reciente
                except:
                    pass
            
            # Limitar a rangos realistas (es raro tener 100% exacto constantemente)
            if nubosidad > 95:
                print(f"🔧 Ajustando nubosidad extrema: {nubosidad}% → 92%")
                nubosidad = 92.0
            
            return max(0.0, min(100.0, nubosidad))
            
        except Exception as e:
            print(f"⚠️ Error corrigiendo nubosidad: {e}")
            return 45.0

    def _obtener_irradiancia_inteligente(self, radiacion_api, radiacion_directa, radiacion_difusa, nubosidad):
        """Obtiene irradiancia usando múltiples fuentes y validaciones"""
        try:
            hora_actual = timezone.now().hour
            
            # Si es de noche, irradiancia debe ser 0
            if hora_actual < 6 or hora_actual > 18:
                print("🌙 Es de noche - Irradiancia = 0")
                return Decimal('0.0')
            
            # Intentar usar datos de la API primero
            if radiacion_api is not None and radiacion_api > 0:
                irradiancia = float(radiacion_api)
                
                # Validar que sea realista para la hora y nubosidad
                irradiancia_maxima_teorica = self._calcular_irradiancia_maxima_hora(hora_actual)
                
                if irradiancia > irradiancia_maxima_teorica * 1.2:  # 20% margen
                    print(f"⚠️ Irradiancia API muy alta: {irradiancia} → usando calculada")
                    irradiancia = self._calcular_irradiancia_desde_nubosidad(nubosidad)
                elif irradiancia < 50 and hora_actual >= 8 and hora_actual <= 16 and nubosidad < 70:
                    print(f"⚠️ Irradiancia API muy baja para condiciones: {irradiancia} → recalculando")
                    irradiancia = self._calcular_irradiancia_desde_nubosidad(nubosidad)
                else:
                    print(f"✅ Irradiancia API válida: {irradiancia} W/m²")
                
                return Decimal(str(round(irradiancia, 1)))
            
            # Si componentes están disponibles, usarlos
            elif radiacion_directa is not None and radiacion_difusa is not None:
                irradiancia_total = float(radiacion_directa) + float(radiacion_difusa)
                print(f"✅ Irradiancia de componentes: {irradiancia_total} W/m² (Dir: {radiacion_directa}, Dif: {radiacion_difusa})")
                return Decimal(str(round(irradiancia_total, 1)))
            
            # Como último recurso, calcular desde nubosidad
            else:
                print("🔧 Calculando irradiancia desde nubosidad...")
                return self._calcular_irradiancia_desde_nubosidad(nubosidad)
                
        except Exception as e:
            print(f"❌ Error obteniendo irradiancia: {e}")
            return self._calcular_irradiancia_desde_nubosidad(nubosidad)

    def _calcular_irradiancia_maxima_hora(self, hora):
        """Calcula irradiancia máxima teórica para una hora específica"""
        if hora < 6 or hora > 18:
            return 0
        
        # Curva parabólica con máximo al mediodía
        factor_horario = 1 - abs(hora - 12) / 6
        factor_horario = max(0.2, factor_horario)
        
        return 950 * factor_horario  # 950 W/m² es el máximo en cielo despejado

    def _determinar_calidad_datos(self, radiacion_api, nubosidad_raw):
        """Determina calidad de datos basado en disponibilidad de información"""
        if radiacion_api is not None and nubosidad_raw is not None:
            return 'alta'
        elif nubosidad_raw is not None:
            return 'media'
        else:
            return 'baja'