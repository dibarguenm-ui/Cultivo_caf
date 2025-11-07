from django.core.management.base import BaseCommand
from cultivos.geolocalizacion import obtener_departamento_por_coordenadas, es_coordenada_colombia, obtener_region_cafetera

class Command(BaseCommand):
    help = 'Prueba el sistema de geolocalización para determinar departamentos'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🗺️  Iniciando prueba de geolocalización...'))
        
        # Coordenadas de prueba de diferentes departamentos
        coordenadas_prueba = [
            {'lat': 6.2442, 'lon': -75.5812, 'lugar': 'Medellín, Antioquia'},
            {'lat': 5.0703, 'lon': -75.5138, 'lugar': 'Manizales, Caldas'},
            {'lat': 4.8134, 'lon': -75.6946, 'lugar': 'Pereira, Risaralda'},
            {'lat': 4.5389, 'lon': -75.6811, 'lugar': 'Armenia, Quindío'},
            {'lat': 3.4516, 'lon': -76.5320, 'lugar': 'Cali, Valle del Cauca'},
            {'lat': 4.7110, 'lon': -74.0721, 'lugar': 'Bogotá, Cundinamarca'},
            {'lat': 2.9273, 'lon': -75.2819, 'lugar': 'Neiva, Huila'},
            {'lat': 4.4389, 'lon': -75.2322, 'lugar': 'Ibagué, Tolima'},
            {'lat': 2.4448, 'lon': -76.6147, 'lugar': 'Popayán, Cauca'},
            {'lat': 1.2136, 'lon': -77.2811, 'lugar': 'Pasto, Nariño'},
        ]
        
        for coord in coordenadas_prueba:
            lat, lon = coord['lat'], coord['lon']
            lugar = coord['lugar']
            
            # Verificar si está en Colombia
            en_colombia = es_coordenada_colombia(lat, lon)
            
            if en_colombia:
                # Obtener departamento
                departamento = obtener_departamento_por_coordenadas(lat, lon)
                region = obtener_region_cafetera(departamento)
                
                self.stdout.write(
                    f"📍 {lugar}\n"
                    f"   Coordenadas: {lat}, {lon}\n"
                    f"   Departamento detectado: {departamento}\n"
                    f"   Región cafetera: {region}\n"
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f"⚠️  {lugar} - Coordenadas fuera de Colombia")
                )
        
        # Probar coordenadas fuera de Colombia
        self.stdout.write(self.style.WARNING('\n🌍 Probando coordenadas fuera de Colombia:'))
        coordenadas_externas = [
            {'lat': 40.7128, 'lon': -74.0060, 'lugar': 'Nueva York, USA'},
            {'lat': -23.5505, 'lon': -46.6333, 'lugar': 'São Paulo, Brasil'},
        ]
        
        for coord in coordenadas_externas:
            lat, lon = coord['lat'], coord['lon']
            lugar = coord['lugar']
            en_colombia = es_coordenada_colombia(lat, lon)
            
            if not en_colombia:
                self.stdout.write(f"❌ {lugar} - Correctamente detectado fuera de Colombia")
            else:
                self.stdout.write(self.style.ERROR(f"🚨 {lugar} - ERROR: Detectado incorrectamente en Colombia"))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Prueba de geolocalización completada'))