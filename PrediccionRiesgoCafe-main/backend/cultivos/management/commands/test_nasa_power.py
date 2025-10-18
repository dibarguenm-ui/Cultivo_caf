from django.core.management.base import BaseCommand
from decimal import Decimal
from clima.services import ServicioDatosClimaticos

class LotePrueba:
    def __init__(self, nombre, latitud, longitud, departamento):
        self.nombre = nombre
        self.latitud = latitud
        self.longitud = longitud
        self.departamento = departamento

class Command(BaseCommand):
    help = 'Prueba la integración con NASA POWER API'

    def handle(self, *args, **options):
        self.stdout.write("\n" + "="*80)
        self.stdout.write(self.style.SUCCESS("🧪 PRUEBA COMPLETA DE NASA POWER API"))
        self.stdout.write("="*80 + "\n")

        # Lotes de prueba en diferentes regiones cafetaleras
        lotes_prueba = [
            LotePrueba(
                nombre="Lote Medellín",
                latitud=Decimal("6.2442"),
                longitud=Decimal("-75.5812"),
                departamento="Antioquia"
            ),
            LotePrueba(
                nombre="Lote Pereira",
                latitud=Decimal("4.8133"),
                longitud=Decimal("-75.6964"),
                departamento="Risaralda"
            ),
            LotePrueba(
                nombre="Lote Manizales",
                latitud=Decimal("5.0690"),
                longitud=Decimal("-75.5044"),
                departamento="Caldas"
            ),
        ]

        servicio = ServicioDatosClimaticos()
        resultados = []

        for i, lote in enumerate(lotes_prueba, 1):
            self.stdout.write(f"\n--- Prueba {i}/{len(lotes_prueba)} ---")
            self.stdout.write(f"Ubicación: {lote.nombre}")
            self.stdout.write(f"Coordenadas: ({lote.latitud}, {lote.longitud})\n")
            
            datos = servicio.obtener_datos_actuales(lote)
            
            if datos:
                self.stdout.write(self.style.SUCCESS(f"✅ Datos obtenidos"))
                resultados.append((lote.nombre, datos, True))
            else:
                self.stdout.write(self.style.ERROR(f"❌ Error obteniendo datos"))
                resultados.append((lote.nombre, None, False))

        # Resumen final
        self.stdout.write("\n" + "="*80)
        self.stdout.write(self.style.SUCCESS("📊 RESUMEN DE PRUEBAS"))
        self.stdout.write("="*80 + "\n")

        exitosos = sum(1 for _, _, ok in resultados if ok)
        self.stdout.write(f"Total: {len(resultados)} lotes")
        self.stdout.write(self.style.SUCCESS(f"Exitosos: {exitosos} ✅"))
        self.stdout.write(f"Fallidos: {len(resultados) - exitosos}\n")

        # Detalles
        for nombre, datos, ok in resultados:
            if ok and datos:
                self.stdout.write(f"\n{nombre}:")
                self.stdout.write(f"  🌡️  Temperatura: {datos['temperatura']}°C")
                self.stdout.write(f"  💧 Humedad: {datos['humedad_relativa']}%")
                self.stdout.write(f"  ☀️  Irradiancia: {datos['irradiancia_solar']} W/m²")
                self.stdout.write(f"  ☁️  Nubosidad: {datos['nubosidad']}%")
                self.stdout.write(f"  🌧️  Precipitación: {datos['precipitacion']} mm")
                self.stdout.write(f"  Descripción: {datos['descripcion_clima']}")

        self.stdout.write("\n" + "="*80)
        if exitosos == len(resultados):
            self.stdout.write(self.style.SUCCESS("✅ TODAS LAS PRUEBAS EXITOSAS"))
            self.stdout.write(self.style.SUCCESS("La migración está lista para producción"))
        else:
            self.stdout.write(self.style.WARNING(f"⚠️  {len(resultados) - exitosos} prueba(s) fallaron"))
        self.stdout.write("="*80 + "\n")

