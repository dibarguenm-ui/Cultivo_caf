from django.contrib import admin
from .models import PrediccionRadiacion, HistorialPrediccion, ConfiguracionPrediccion


@admin.register(PrediccionRadiacion)
class PrediccionRadiacionAdmin(admin.ModelAdmin):
    list_display = [
        'lote', 'usuario', 'tipo_prediccion', 'metodo_utilizado',
        'fecha_generacion', 'confianza_prediccion', 'nivel_riesgo_predicho',
        'alerta_generada'
    ]
    list_filter = [
        'tipo_prediccion', 'metodo_utilizado', 'nivel_riesgo_predicho',
        'alerta_generada', 'fecha_generacion'
    ]
    search_fields = ['lote__nombre', 'usuario__email']
    readonly_fields = [
        'fecha_generacion', 'fecha_actualizacion', 'r2_score', 
        'mae_score', 'get_prediccion_promedio', 'get_dias_predichos'
    ]
    fieldsets = (
        ('Información Básica', {
            'fields': ('lote', 'usuario', 'tipo_prediccion', 'metodo_utilizado')
        }),
        ('Datos Actuales', {
            'fields': ('radiacion_actual', 'temperatura_actual', 'humedad_actual')
        }),
        ('Predicciones', {
            'fields': ('radiacion_predicha', 'confianza_prediccion', 'datos_historicos_usados')
        }),
        ('Métricas del Modelo', {
            'fields': ('r2_score', 'mae_score'),
            'classes': ('collapse',)
        }),
        ('Análisis de Riesgo', {
            'fields': ('nivel_riesgo_predicho', 'alerta_generada')
        }),
        ('Timestamps', {
            'fields': ('fecha_generacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('lote', 'usuario')


@admin.register(HistorialPrediccion)
class HistorialPrediccionAdmin(admin.ModelAdmin):
    list_display = [
        'prediccion_original', 'fecha_verificacion', 'radiacion_real',
        'radiacion_predicha', 'error_absoluto', 'error_porcentual'
    ]
    list_filter = ['fecha_verificacion', 'fecha_creacion']
    search_fields = ['prediccion_original__lote__nombre']
    readonly_fields = ['fecha_creacion']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('prediccion_original__lote')


@admin.register(ConfiguracionPrediccion)
class ConfiguracionPrediccionAdmin(admin.ModelAdmin):
    list_display = [
        'dias_historicos_minimos', 'dias_historicos_recomendados',
        'confianza_minima_alerta', 'reentrenar_cada_dias',
        'generar_predicciones_automaticas', 'fecha_actualizacion'
    ]
    fieldsets = (
        ('Configuración de Datos', {
            'fields': ('dias_historicos_minimos', 'dias_historicos_recomendados')
        }),
        ('Umbrales de Confianza', {
            'fields': ('confianza_minima_alerta', 'max_error_aceptable')
        }),
        ('Re-entrenamiento', {
            'fields': ('reentrenar_cada_dias',)
        }),
        ('Predicciones Automáticas', {
            'fields': ('generar_predicciones_automaticas', 'hora_generacion_automatica')
        }),
        ('Timestamps', {
            'fields': ('fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        })
    )
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']
    
    def has_add_permission(self, request):
        # Solo permitir una configuración
        return not ConfiguracionPrediccion.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # No permitir eliminar la configuración
        return False
