from django.db import models
from cultivos.models import LoteCafe

class DatosClimaticos(models.Model):
    """Modelo exclusivo para almacenar datos climáticos de lotes"""

    lote = models.ForeignKey(LoteCafe, on_delete=models.CASCADE, related_name='datos_climaticos')
    fecha_registro = models.DateTimeField(auto_now_add=True)
    fecha_medicion = models.DateTimeField(help_text="Fecha real de la medición")

    # VARIABLES CLIMÁTICAS PRINCIPALES (RF7)
    irradiancia_solar = models.DecimalField(
        max_digits=8, decimal_places=2,
        help_text="Irradiancia solar global (GHI) en W/m²"
    )
    temperatura = models.DecimalField(
        max_digits=5, decimal_places=2,
        help_text="Temperatura ambiente en °C"
    )
    humedad_relativa = models.DecimalField(
        max_digits=5, decimal_places=2,
        help_text="Humedad relativa en %"
    )
    nubosidad = models.DecimalField(
        max_digits=5, decimal_places=2,
        help_text="Nubosidad en %", null=True, blank=True
    )
    precipitacion = models.DecimalField(
        max_digits=6, decimal_places=2,
        help_text="Precipitación en mm", null=True, blank=True
    )
    presion_atmosferica = models.DecimalField(
        max_digits=6, decimal_places=2,
        help_text="Presión atmosférica en hPa", null=True, blank=True
    )
    velocidad_viento = models.DecimalField(
        max_digits=5, decimal_places=2,
        help_text="Velocidad del viento en m/s", null=True, blank=True
    )

    # FUENTE DE DATOS
    fuente_datos = models.CharField(max_length=20, choices=[
        ('nasa_power', 'NASA POWER'),
        ('manual', 'Ingreso Manual')
    ], default='nasa_power')

    # Metadata
    calidad_datos = models.CharField(max_length=10, choices=[
        ('alta', 'Alta'),
        ('media', 'Media'),
        ('baja', 'Baja')
    ], default='media')
    
    # INFORMACIÓN ADICIONAL DE LA MEDICIÓN
    descripcion_clima = models.CharField(
        max_length=100, blank=True, null=True,
        help_text="Descripción del clima (ej: nubes, lluvia)"
    )
    ciudad = models.CharField(
        max_length=100, blank=True, null=True,
        help_text="Ciudad donde se realizó la medición"
    )

    class Meta:
        db_table = 'clima_datos_climaticos'
        ordering = ['-fecha_registro']
        indexes = [
            models.Index(fields=['lote', 'fecha_registro']),
            models.Index(fields=['fecha_medicion']),
        ]
        verbose_name = 'Dato Climático'
        verbose_name_plural = 'Datos Climáticos'

    def __str__(self):
        return f"Clima {self.lote.nombre} - {self.fecha_medicion.strftime('%Y-%m-%d %H:%M')}"

class HistoricoClimatico(models.Model):
    """Almacenamiento de datos históricos climáticos"""
    lote = models.ForeignKey(LoteCafe, on_delete=models.CASCADE, related_name='historico_climatico')
    fecha = models.DateField()

    # Promedios diarios
    temp_promedio = models.DecimalField(max_digits=5, decimal_places=2)
    temp_maxima = models.DecimalField(max_digits=5, decimal_places=2)
    temp_minima = models.DecimalField(max_digits=5, decimal_places=2)
    humedad_promedio = models.DecimalField(max_digits=5, decimal_places=2)
    irradiancia_promedio = models.DecimalField(max_digits=8, decimal_places=2)
    precipitacion_acumulada = models.DecimalField(max_digits=6, decimal_places=2)

    class Meta:
        db_table = 'clima_historico'
        unique_together = ['lote', 'fecha']
        indexes = [
            models.Index(fields=['lote', 'fecha']),
        ]
