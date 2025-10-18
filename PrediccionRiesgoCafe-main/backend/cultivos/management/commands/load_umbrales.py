from django.core.management.base import BaseCommand
from cultivos.models import UmbralRadiacionSolar

class Command(BaseCommand):
    help = 'Carga los umbrales de radiación solar para las variedades de café'

    def handle(self, *args, **options):
        umbrales_data = [
            {
                'variedad': 'Castillo',
                'radiacion_minima': 300,
                'radiacion_optima': 600,
                'radiacion_maxima': 900,
                'nivel_sombra_recomendado': 'Medio',
                'descripcion': 'Variedad robusta, tolerante a plagas, producción estable'
            },
            {
                'variedad': 'Caturra',
                'radiacion_minima': 250,
                'radiacion_optima': 550,
                'radiacion_maxima': 850,
                'nivel_sombra_recomendado': 'Medio-Alto',
                'descripcion': 'Variedad productiva, buena calidad de taza, requiere más sombra'
            },
            {
                'variedad': 'Bourbon',
                'radiacion_minima': 200,
                'radiacion_optima': 500,
                'radiacion_maxima': 800,
                'nivel_sombra_recomendado': 'Alto',
                'descripcion': 'Variedad clásica, excelente calidad, sensible al calor'
            },
            {
                'variedad': 'Típica',
                'radiacion_minima': 200,
                'radiacion_optima': 480,
                'radiacion_maxima': 780,
                'nivel_sombra_recomendado': 'Alto',
                'descripcion': 'Variedad tradicional, requiere sombra significativa'
            },
            {
                'variedad': 'Maragogipe',
                'radiacion_minima': 220,
                'radiacion_optima': 520,
                'radiacion_maxima': 820,
                'nivel_sombra_recomendado': 'Alto',
                'descripcion': 'Grano grande, sensible a radiación excesiva'
            },
            {
                'variedad': 'Tabí',
                'radiacion_minima': 280,
                'radiacion_optima': 580,
                'radiacion_maxima': 880,
                'nivel_sombra_recomendado': 'Medio',
                'descripcion': 'Variedad resistente, buena tolerancia a plagas'
            },
            {
                'variedad': 'Geisha',
                'radiacion_minima': 150,
                'radiacion_optima': 450,
                'radiacion_maxima': 700,
                'nivel_sombra_recomendado': 'Alto',
                'descripcion': 'Café gourmet, muy sensible a cambios ambientales, requiere sombra'
            },
            {
                'variedad': 'Otro',
                'radiacion_minima': 250,
                'radiacion_optima': 550,
                'radiacion_maxima': 850,
                'nivel_sombra_recomendado': 'Medio',
                'descripcion': 'Valores por defecto para otras variedades'
            },
        ]
        
        created_count = 0
        for datos in umbrales_data:
            umbral, created = UmbralRadiacionSolar.objects.get_or_create(
                variedad=datos['variedad'],
                defaults={
                    'radiacion_minima': datos['radiacion_minima'],
                    'radiacion_optima': datos['radiacion_optima'],
                    'radiacion_maxima': datos['radiacion_maxima'],
                    'nivel_sombra_recomendado': datos['nivel_sombra_recomendado'],
                    'descripcion': datos['descripcion']
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Creado: {datos["variedad"]}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'~ Ya existe: {datos["variedad"]}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\n✅ Proceso completado: {created_count} nuevos umbrales cargados')
        )
