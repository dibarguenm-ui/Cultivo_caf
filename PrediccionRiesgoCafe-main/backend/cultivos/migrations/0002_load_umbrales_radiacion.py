# Generated migration - Load initial radiation thresholds

from django.db import migrations

def load_umbrales(apps, schema_editor):
    UmbralRadiacionSolar = apps.get_model('cultivos', 'UmbralRadiacionSolar')
    
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
    
    for datos in umbrales_data:
        UmbralRadiacionSolar.objects.get_or_create(
            variedad=datos['variedad'],
            defaults={
                'radiacion_minima': datos['radiacion_minima'],
                'radiacion_optima': datos['radiacion_optima'],
                'radiacion_maxima': datos['radiacion_maxima'],
                'nivel_sombra_recomendado': datos['nivel_sombra_recomendado'],
                'descripcion': datos['descripcion']
            }
        )

def reverse_umbrales(apps, schema_editor):
    UmbralRadiacionSolar = apps.get_model('cultivos', 'UmbralRadiacionSolar')
    UmbralRadiacionSolar.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('cultivos', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(load_umbrales, reverse_umbrales),
    ]
