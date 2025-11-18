"""
Script de diagnóstico para verificar por qué la irradiancia es 0
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.utils import timezone
from clima.models import DatosClimaticos
from cultivos.models import LoteCafe
from datetime import datetime, timedelta

print("=" * 70)
print("🔍 DIAGNÓSTICO DE IRRADIANCIA SOLAR")
print("=" * 70)

# 1. Verificar zona horaria
print(f"\n📅 INFORMACIÓN DE FECHA Y HORA:")
now = timezone.now()
print(f"   Hora actual (timezone.now()): {now}")
print(f"   Hora solo: {now.hour}:{now.minute}")
print(f"   Zona horaria configurada: {timezone.get_current_timezone()}")

# 2. Ver últimas mediciones
print(f"\n📊 ÚLTIMAS 10 MEDICIONES EN LA BASE DE DATOS:")
ultimas = DatosClimaticos.objects.order_by('-fecha_medicion')[:10]

if not ultimas.exists():
    print("   ❌ No hay mediciones en la base de datos")
else:
    print(f"   {'Fecha':<20} {'Hora':<10} {'Irradiancia':<15} {'Temp':<10} {'Fuente'}")
    print("   " + "-" * 70)
    for dato in ultimas:
        hora_str = dato.fecha_medicion.strftime("%H:%M:%S")
        fecha_str = dato.fecha_medicion.strftime("%Y-%m-%d")
        print(f"   {fecha_str:<20} {hora_str:<10} {dato.irradiancia_solar:<15} {dato.temperatura:<10} {dato.fuente_datos}")

# 3. Verificar si hay lotes
print(f"\n🌱 LOTES REGISTRADOS:")
lotes = LoteCafe.objects.all()
if not lotes.exists():
    print("   ❌ No hay lotes registrados")
else:
    for lote in lotes:
        print(f"   - {lote.nombre} ({lote.latitud}, {lote.longitud})")

# 4. Probar conversión de irradiancia manualmente
print(f"\n🧪 PRUEBA DE CONVERSIÓN DE IRRADIANCIA:")
print(f"   Hora actual: {now.hour}:00")

if now.hour < 6 or now.hour > 18:
    print(f"   ⚠️ HORA NOCTURNA DETECTADA ({now.hour}:00)")
    print(f"   El código retorna 0 porque considera que es de noche")
    print(f"   Verificar: ¿La zona horaria es correcta?")
else:
    print(f"   ✅ Hora diurna ({now.hour}:00) - Debería tener radiación")
    
    # Simular conversión
    import math
    test_kwh = 5.0  # Valor típico
    horas_luz = 12
    watts_prom = (test_kwh * 1000) / horas_luz
    hora_solar = now.hour - 6
    factor = math.sin(math.pi * hora_solar / horas_luz)
    factor = max(0.1, factor)
    irradiancia_calc = watts_prom * factor * 2
    irradiancia_calc = min(1200, max(50 if factor > 0.2 else 0, irradiancia_calc))
    
    print(f"   Test con {test_kwh} kWh/m²/día:")
    print(f"   - Watts promedio: {watts_prom:.1f} W/m²")
    print(f"   - Factor horario: {factor:.2f}")
    print(f"   - Irradiancia calculada: {irradiancia_calc:.1f} W/m²")

# 5. Ver configuración de settings
print(f"\n⚙️ CONFIGURACIÓN DE SETTINGS.PY:")
from django.conf import settings
print(f"   TIME_ZONE: {settings.TIME_ZONE}")
print(f"   USE_TZ: {settings.USE_TZ}")

print("\n" + "=" * 70 + "\n")
