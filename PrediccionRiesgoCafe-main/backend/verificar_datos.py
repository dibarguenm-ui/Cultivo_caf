"""
Script para verificar y limpiar datos problemáticos que causan error scale < 0
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from clima.models import DatosClimaticos
from cultivos.models import LoteCafe
import pandas as pd

print("=" * 70)
print("🔍 VERIFICACIÓN DE DATOS PROBLEMÁTICOS")
print("=" * 70)

# Buscar el lote "Nuevo Lote"
lote = LoteCafe.objects.filter(nombre__icontains="Nuevo Lote").first()

if not lote:
    print("❌ No se encontró el lote 'Nuevo Lote'")
    exit()

print(f"\n🌱 Lote: {lote.nombre}")
print(f"📍 Ubicación: {lote.latitud}, {lote.longitud}")

# Obtener datos
datos = DatosClimaticos.objects.filter(lote=lote).order_by('-fecha_medicion')

print(f"\n📊 Total de registros: {datos.count()}")

# Verificar valores problemáticos
df = pd.DataFrame([{
    'id': d.id,
    'fecha': d.fecha_medicion,
    'radiacion': float(d.irradiancia_solar),
    'temperatura': float(d.temperatura),
    'humedad': float(d.humedad_relativa),
    'presion': float(d.presion_atmosferica) if d.presion_atmosferica else 0,
    'velocidad_viento': float(d.velocidad_viento) if d.velocidad_viento else 0
} for d in datos[:100]])  # Últimos 100

print("\n📈 ESTADÍSTICAS DE LOS DATOS:")
print(df.describe())

# Buscar valores negativos
print("\n🔍 VALORES NEGATIVOS DETECTADOS:")
for col in ['radiacion', 'temperatura', 'humedad', 'presion', 'velocidad_viento']:
    negativos = df[df[col] < 0]
    if len(negativos) > 0:
        print(f"   ❌ {col}: {len(negativos)} valores negativos")
        print(f"      Min: {df[col].min()}, Max: {df[col].max()}")
    else:
        print(f"   ✅ {col}: Sin valores negativos")

# Buscar valores NaN o infinitos
print("\n🔍 VALORES NaN O INFINITOS:")
for col in ['radiacion', 'temperatura', 'humedad', 'presion', 'velocidad_viento']:
    nans = df[col].isna().sum()
    infs = df[col].isin([float('inf'), float('-inf')]).sum()
    if nans > 0 or infs > 0:
        print(f"   ❌ {col}: {nans} NaN, {infs} infinitos")
    else:
        print(f"   ✅ {col}: Sin valores inválidos")

# Buscar valores extremos (outliers)
print("\n🔍 VALORES EXTREMOS:")
print(f"   Radiación: Min={df['radiacion'].min():.2f}, Max={df['radiacion'].max():.2f}")
print(f"   Temperatura: Min={df['temperatura'].min():.2f}, Max={df['temperatura'].max():.2f}")
print(f"   Humedad: Min={df['humedad'].min():.2f}, Max={df['humedad'].max():.2f}")

# Mostrar últimos 5 registros
print("\n📋 ÚLTIMOS 5 REGISTROS:")
print(df.head()[['fecha', 'radiacion', 'temperatura', 'humedad']])

# Sugerencias de limpieza
print("\n💡 ACCIONES RECOMENDADAS:")
if df['radiacion'].min() < 0:
    print("   - Eliminar o corregir radiaciones negativas")
    negativos_rad = DatosClimaticos.objects.filter(
        lote=lote,
        irradiancia_solar__lt=0
    ).count()
    print(f"     Total a corregir: {negativos_rad}")

if df['temperatura'].min() < -50 or df['temperatura'].max() > 60:
    print("   - Verificar temperaturas fuera de rango razonable")

if df['humedad'].min() < 0 or df['humedad'].max() > 100:
    print("   - Verificar humedades fuera de rango 0-100%")

print("\n" + "=" * 70 + "\n")
