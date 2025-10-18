from django.contrib import admin
from .models import LoteCafe, UmbralRadiacionSolar

@admin.register(LoteCafe)
class LoteCafeAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'usuario', 'departamento', 'variedad', 'hectareas')
    list_filter = ('departamento', 'variedad', 'nivel_sombra')
    search_fields = ('nombre', 'usuario__username')


@admin.register(UmbralRadiacionSolar)
class UmbralRadiacionSolarAdmin(admin.ModelAdmin):
    list_display = ('variedad', 'radiacion_minima', 'radiacion_optima', 'radiacion_maxima', 'nivel_sombra_recomendado')
    list_filter = ('variedad', 'nivel_sombra_recomendado')
    search_fields = ('variedad', 'descripcion')
    fieldsets = (
        ('Variedad', {
            'fields': ('variedad', 'descripcion')
        }),
        ('Umbrales de Radiación Solar (W/m²)', {
            'fields': ('radiacion_minima', 'radiacion_optima', 'radiacion_maxima'),
            'description': 'Define los valores de radiación solar en W/m² para esta variedad'
        }),
        ('Recomendaciones', {
            'fields': ('nivel_sombra_recomendado',)
        }),
    )