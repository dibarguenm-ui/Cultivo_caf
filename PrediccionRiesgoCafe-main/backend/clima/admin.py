from django.contrib import admin
from .models import DatosClimaticos, HistoricoClimatico

@admin.register(DatosClimaticos)
class DatosClimaticosAdmin(admin.ModelAdmin):
    list_display = ['lote', 'fecha_medicion', 'temperatura', 'humedad_relativa', 'irradiancia_solar', 'fuente_datos']
    list_filter = ['fuente_datos', 'calidad_datos', 'fecha_medicion']
    search_fields = ['lote__nombre', 'lote__departamento']

@admin.register(HistoricoClimatico)
class HistoricoClimaticoAdmin(admin.ModelAdmin):
    list_display = ['lote', 'fecha', 'temp_promedio', 'irradiancia_promedio']
    list_filter = ['fecha']
    search_fields = ['lote__nombre']