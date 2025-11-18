"""
Script simple para cargar datos históricos usando el código EXISTENTE
NO modifica ningún archivo del proyecto
Ejecutar desde: backend/
Comando: python cargar_datos_historicos_simple.py
"""

import os
import django
import sys

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from cultivos.models import LoteCafe
from clima.models import DatosClimaticos
from clima.services import ServicioDatosClimaticos
from django.utils import timezone
from datetime import timedelta, datetime
import time

def cargar_datos_historicos(dias=90):
    """
    Carga datos históricos usando NASA POWER API
    """
    print("=" * 70)
    print("🌦️  CARGANDO DATOS HISTÓRICOS CLIMÁTICOS")
    print("=" * 70)
    
    # Obtener todos los lotes
    lotes = LoteCafe.objects.all()
    
    if not lotes.exists():
        print("\n❌ ERROR: No hay lotes registrados en el sistema")
        print("💡 SOLUCIÓN: Primero crea un lote desde la interfaz web")
        return
    
    print(f"\n📊 Lotes encontrados: {lotes.count()}")
    print(f"📅 Días históricos a cargar: {dias}")
    
    # Calcular fechas
    fecha_fin = timezone.now().date()
    fecha_inicio = fecha_fin - timedelta(days=dias)
    
    print(f"📆 Rango: {fecha_inicio} al {fecha_fin}\n")
    
    # Servicio NASA
    servicio = ServicioDatosClimaticos()
    
    total_registros = 0
    lotes_exitosos = 0
    
    for idx, lote in enumerate(lotes, 1):
        print(f"\n{'='*70}")
        print(f"[{idx}/{lotes.count()}] 🌱 LOTE: {lote.nombre}")
        print(f"{'='*70}")
        print(f"📍 Ubicación: {lote.latitud}, {lote.longitud}")
        print(f"🌿 Variedad: {lote.variedad}")
        
        # Verificar datos existentes
        datos_existentes = DatosClimaticos.objects.filter(
            lote=lote,
            fecha_medicion__date__gte=fecha_inicio,
            fecha_medicion__date__lte=fecha_fin
        ).count()
        
        if datos_existentes > 0:
            print(f"\n⚠️  Ya existen {datos_existentes} registros")
            respuesta = input("¿Reemplazar? (s/n): ").lower().strip()
            
            if respuesta == 's':
                DatosClimaticos.objects.filter(
                    lote=lote,
                    fecha_medicion__date__gte=fecha_inicio,
                    fecha_medicion__date__lte=fecha_fin
                ).delete()
                print(f"🗑️  {datos_existentes} registros eliminados")
            else:
                print("⏭️  Saltando este lote...")
                continue
        
        # Obtener coordenadas
        if lote.latitud and lote.longitud:
            lat = float(lote.latitud)
            lon = float(lote.longitud)
        else:
            print("❌ Este lote no tiene coordenadas válidas")
            continue
        
        print(f"\n🔄 Descargando datos de NASA POWER...")
        
        # Usar el método EXISTENTE del servicio
        try:
            # Llamar a la función interna que ya existe
            fecha_fin_str = fecha_fin.strftime('%Y%m%d')
            fecha_inicio_str = fecha_inicio.strftime('%Y%m%d')
            
            params = {
                'parameters': 'T2M,RH2M,ALLSKY_SFC_SW_DWN,PRECTOTCORR',
                'community': 'AG',
                'longitude': lon,
                'latitude': lat,
                'start': fecha_inicio_str,
                'end': fecha_fin_str,
                'format': 'JSON'
            }
            
            import requests
            response = requests.get(
                "https://power.larc.nasa.gov/api/temporal/daily/point",
                params=params,
                timeout=30
            )
            
            if response.status_code != 200:
                print(f"❌ Error HTTP: {response.status_code}")
                continue
            
            data = response.json()
            parameter_data = data.get('properties', {}).get('parameter', {})
            
            if not parameter_data:
                print("❌ Sin datos en la respuesta")
                continue
            
            # Procesar cada fecha
            registros_creados = 0
            temperaturas = parameter_data.get('T2M', {})
            humedades = parameter_data.get('RH2M', {})
            irradiancias = parameter_data.get('ALLSKY_SFC_SW_DWN', {})
            precipitaciones = parameter_data.get('PRECTOTCORR', {})
            
            for fecha_str, temp_valor in temperaturas.items():
                try:
                    fecha = datetime.strptime(fecha_str, '%Y%m%d').date()
                    
                    # Validar datos
                    temp = float(temp_valor)
                    humedad = float(humedades.get(fecha_str, -999))
                    irradiancia = float(irradiancias.get(fecha_str, -999))
                    precipitacion = float(precipitaciones.get(fecha_str, 0))
                    
                    # Saltar valores inválidos (-999 = sin datos)
                    if temp == -999 or humedad == -999:
                        continue
                    
                    # Si irradiancia es inválida, usar 0
                    if irradiancia == -999:
                        irradiancia = 0
                    
                    # Crear registro
                    DatosClimaticos.objects.create(
                        lote=lote,
                        fecha_medicion=datetime.combine(fecha, datetime.min.time()),
                        temperatura=round(temp, 2),
                        humedad_relativa=round(humedad, 2),
                        irradiancia_solar=round(irradiancia, 2),
                        precipitacion=round(precipitacion, 2),
                        fuente_datos='NASA_POWER',
                        calidad_datos='BUENA'
                    )
                    
                    registros_creados += 1
                    
                except Exception as e:
                    continue
            
            print(f"✅ {registros_creados} registros creados")
            total_registros += registros_creados
            lotes_exitosos += 1
            
            # Pausa entre lotes
            if idx < lotes.count():
                time.sleep(2)
            
        except Exception as e:
            print(f"❌ Error: {e}")
            continue
    
    # Resumen
    print("\n" + "=" * 70)
    print("📊 RESUMEN")
    print("=" * 70)
    print(f"✅ Lotes procesados: {lotes_exitosos}/{lotes.count()}")
    print(f"📈 Total registros: {total_registros}")
    
    if total_registros >= 30:
        print("\n✨ ¡SISTEMA LISTO PARA PREDICCIONES!")
    else:
        print(f"\n⚠️  Se necesitan ≥30 registros por lote")
        print(f"   Tienes: {total_registros}")
    
    print("\n" + "=" * 70 + "\n")

if __name__ == '__main__':
    try:
        # Permitir especificar días como argumento
        dias = 90
        if len(sys.argv) > 1:
            dias = int(sys.argv[1])
        
        cargar_datos_historicos(dias)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Proceso cancelado por el usuario")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
