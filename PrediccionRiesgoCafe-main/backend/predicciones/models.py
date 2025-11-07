from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from cultivos.models import LoteCafe
from django.conf import settings


class PrediccionRadiacion(models.Model):
    """
    Modelo para almacenar predicciones de radiación solar
    """
    TIPO_PREDICCION_CHOICES = [
        ('1_dia', '1 día'),
        ('3_dias', '3 días'),
        ('7_dias', '7 días'),
    ]
    
    METODO_PREDICCION_CHOICES = [
        ('linear_regression', 'Regresión Lineal'),
        ('random_forest', 'Random Forest'),
        ('arima', 'ARIMA'),
        ('ensemble', 'Conjunto de Modelos'),
    ]
    
    # Relaciones
    lote = models.ForeignKey(
        LoteCafe, 
        on_delete=models.CASCADE,
        related_name='predicciones'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    
    # Configuración de predicción
    tipo_prediccion = models.CharField(
        max_length=10,
        choices=TIPO_PREDICCION_CHOICES,
        default='3_dias'
    )
    metodo_utilizado = models.CharField(
        max_length=20,
        choices=METODO_PREDICCION_CHOICES,
        default='random_forest'
    )
    
    # Datos de entrada (contexto)
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    radiacion_actual = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        help_text="Radiación actual en W/m²"
    )
    temperatura_actual = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Temperatura actual en °C"
    )
    humedad_actual = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Humedad actual en %"
    )
    
    # Datos de predicción
    radiacion_predicha = models.JSONField(
        help_text="Array con predicciones: [día1, día2, ...]"
    )
    confianza_prediccion = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Nivel de confianza de la predicción (%)"
    )
    
    # Metadatos del modelo
    datos_historicos_usados = models.IntegerField(
        help_text="Cantidad de días históricos utilizados"
    )
    r2_score = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="R² del modelo utilizado"
    )
    mae_score = models.DecimalField(
        max_digits=8,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="Error Absoluto Medio"
    )
    
    # Análisis de riesgo
    alerta_generada = models.BooleanField(
        default=False,
        help_text="Si se generó alerta por radiación peligrosa"
    )
    nivel_riesgo_predicho = models.CharField(
        max_length=10,
        choices=[
            ('bajo', 'Bajo'),
            ('medio', 'Medio'), 
            ('alto', 'Alto'),
            ('critico', 'Crítico')
        ],
        default='medio'
    )
    
    # Timestamps
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'predicciones_radiacion'
        verbose_name = 'Predicción de Radiación Solar'
        verbose_name_plural = 'Predicciones de Radiación Solar'
        ordering = ['-fecha_generacion']
        indexes = [
            models.Index(fields=['lote', 'fecha_generacion']),
            models.Index(fields=['usuario', 'fecha_generacion']),
            models.Index(fields=['tipo_prediccion']),
        ]
    
    def __str__(self):
        return f"Predicción {self.tipo_prediccion} - {self.lote.nombre} - {self.fecha_generacion.strftime('%Y-%m-%d %H:%M')}"
    
    def get_prediccion_promedio(self):
        """Retorna el promedio de las predicciones"""
        if isinstance(self.radiacion_predicha, list):
            return sum(self.radiacion_predicha) / len(self.radiacion_predicha)
        return 0
    
    def get_dias_predichos(self):
        """Retorna la cantidad de días predichos"""
        if isinstance(self.radiacion_predicha, list):
            return len(self.radiacion_predicha)
        return 0
    
    def evaluar_riesgo_futuro(self):
        """
        Evalúa el riesgo basado en las predicciones y umbrales del lote
        """
        try:
            from cultivos.models import UmbralRadiacionSolar
            umbral = UmbralRadiacionSolar.objects.get(variedad=self.lote.variedad)
            
            predicciones = self.radiacion_predicha
            if not isinstance(predicciones, list):
                return 'desconocido'
            
            # Contar días por nivel de riesgo
            dias_criticos = sum(1 for p in predicciones if p > float(umbral.radiacion_maxima) * 1.2)
            dias_altos = sum(1 for p in predicciones if p > float(umbral.radiacion_maxima))
            dias_bajos = sum(1 for p in predicciones if p < float(umbral.radiacion_minima))
            
            if dias_criticos > 0:
                return 'critico'
            elif dias_altos >= len(predicciones) // 2:
                return 'alto'
            elif dias_bajos >= len(predicciones) // 2:
                return 'bajo'
            else:
                return 'medio'
                
        except:
            return 'desconocido'


class HistorialPrediccion(models.Model):
    """
    Modelo para hacer seguimiento de la precisión de las predicciones
    """
    prediccion_original = models.ForeignKey(
        PrediccionRadiacion,
        on_delete=models.CASCADE,
        related_name='historial_precision'
    )
    
    fecha_verificacion = models.DateField(
        help_text="Fecha en que se verificó la predicción"
    )
    radiacion_real = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        help_text="Radiación real observada en W/m²"
    )
    radiacion_predicha = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        help_text="Radiación que se había predicho en W/m²"
    )
    error_absoluto = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        help_text="Error absoluto |real - predicho|"
    )
    error_porcentual = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        help_text="Error porcentual"
    )
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'historial_precision_predicciones'
        verbose_name = 'Historial de Precisión'
        verbose_name_plural = 'Historial de Precisiones'
        unique_together = ['prediccion_original', 'fecha_verificacion']
    
    def __str__(self):
        return f"Verificación {self.fecha_verificacion} - Error: {self.error_porcentual}%"


class ConfiguracionPrediccion(models.Model):
    """
    Configuración global para el sistema de predicciones
    """
    # Configuración de modelos ML
    dias_historicos_minimos = models.IntegerField(
        default=30,
        help_text="Mínimo de días históricos necesarios para predicir"
    )
    dias_historicos_recomendados = models.IntegerField(
        default=90,
        help_text="Días históricos recomendados para mejor precisión"
    )
    
    # Umbrales de confianza
    confianza_minima_alerta = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=70.0,
        help_text="Confianza mínima para generar alertas (%)"
    )
    
    # Configuración de re-entrenamiento
    reentrenar_cada_dias = models.IntegerField(
        default=7,
        help_text="Re-entrenar modelos cada X días"
    )
    max_error_aceptable = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=15.0,
        help_text="Error máximo aceptable antes de re-entrenar (%)"
    )
    
    # Configuración de predicciones automáticas
    generar_predicciones_automaticas = models.BooleanField(
        default=True,
        help_text="Generar predicciones automáticamente"
    )
    hora_generacion_automatica = models.TimeField(
        default='06:00:00',
        help_text="Hora para generar predicciones automáticas"
    )
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'configuracion_predicciones'
        verbose_name = 'Configuración de Predicciones'
        verbose_name_plural = 'Configuraciones de Predicciones'
    
    def __str__(self):
        return f"Configuración Predicciones - Actualizada: {self.fecha_actualizacion.strftime('%Y-%m-%d')}"
