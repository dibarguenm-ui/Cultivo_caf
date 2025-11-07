"""
Comando para inicializar la configuración de predicciones
"""

from django.core.management.base import BaseCommand
from predicciones.models import ConfiguracionPrediccion


class Command(BaseCommand):
    help = 'Inicializa la configuración por defecto para el sistema de predicciones'
    
    def handle(self, *args, **options):
        # Verificar si ya existe configuración
        if ConfiguracionPrediccion.objects.exists():
            self.stdout.write(
                self.style.WARNING('Ya existe configuración de predicciones')
            )
            return
        
        # Crear configuración por defecto
        ConfiguracionPrediccion.objects.create(
            dias_historicos_minimos=30,
            dias_historicos_recomendados=90,
            confianza_minima_alerta=70.0,
            reentrenar_cada_dias=7,
            max_error_aceptable=15.0,
            generar_predicciones_automaticas=True,
            hora_generacion_automatica='06:00:00'
        )
        
        self.stdout.write(
            self.style.SUCCESS('Configuración de predicciones creada exitosamente')
        )