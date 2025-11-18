"""
Script para limpiar datos anómalos (presión extrema)
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from clima.models import DatosClimaticos

print("=" * 70)
print("🧹 LIMPIANDO DATOS ANÓMALOS")
print("=" * 70)

# Buscar presiones anómalas (> 200 kPa es claramente un error)
datos_anomalos = DatosClimaticos.objects.filter(presion_atmosferica__gt=200)

print(f"\n📊 Registros con presión anómala (>200 kPa): {datos_anomalos.count()}")

if datos_anomalos.count() > 0:
    print("\n📋 REGISTROS ANÓMALOS:")
    for dato in datos_anomalos:
        print(f"   ID {dato.id}: Presión = {dato.presion_atmosferica} kPa (Lote: {dato.lote.nombre})")
    
    respuesta = input("\n¿Corregir a 81.0 kPa (presión normal para Colombia)? (s/n): ").lower().strip()
    
    if respuesta == 's':
        count = datos_anomalos.update(presion_atmosferica=81.0)
        print(f"\n✅ {count} registros corregidos")
    else:
        print("\n⏭️  No se realizaron cambios")
else:
    print("\n✅ No se encontraron presiones anómalas")

# Verificar radiaciones extremadamente altas (> 1500 W/m² es sospechoso)
datos_rad_alta = DatosClimaticos.objects.filter(irradiancia_solar__gt=1500)

print(f"\n📊 Registros con radiación muy alta (>1500 W/m²): {datos_rad_alta.count()}")

if datos_rad_alta.count() > 0:
    print("\n📋 RADIACIONES ALTAS:")
    for dato in datos_rad_alta[:10]:
        print(f"   ID {dato.id}: Radiación = {dato.irradiancia_solar} W/m² (Lote: {dato.lote.nombre})")

print("\n" + "=" * 70 + "\n")
