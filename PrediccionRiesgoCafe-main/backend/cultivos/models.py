from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings  # ✅ Importar así para evitar circular


class UmbralRadiacionSolar(models.Model):
    """
    Modelo que define los umbrales de radiación solar óptima por variedad de café.
    Estos umbrales son críticos para la gestión de riesgos.
    """
    
    VARIEDAD_CHOICES = [
        ('Caturra', 'Caturra'),
        ('Castillo', 'Castillo'),
        ('Bourbon', 'Bourbon'),
        ('Típica', 'Típica'),
        ('Maragogipe', 'Maragogipe'),
        ('Tabí', 'Tabí'),
        ('Geisha', 'Geisha'),
        ('Otro', 'Otro'),
    ]
    
    variedad = models.CharField(
        max_length=20,
        choices=VARIEDAD_CHOICES,
        unique=True,
        help_text="Variedad de café"
    )
    
    # Umbrales en W/m² (vatios por metro cuadrado)
    radiacion_minima = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        help_text="Radiación solar mínima óptima (W/m²)"
    )
    radiacion_optima = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        help_text="Radiación solar óptima (W/m²)"
    )
    radiacion_maxima = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        help_text="Radiación solar máxima aceptable (W/m²)"
    )
    
    # Información adicional
    descripcion = models.TextField(
        blank=True,
        help_text="Descripción de características especiales"
    )
    nivel_sombra_recomendado = models.CharField(
        max_length=10,
        choices=[('Alto', 'Alto'), ('Medio', 'Medio'), ('Bajo', 'Bajo')],
        default='Medio',
        help_text="Nivel de sombra recomendado para esta variedad"
    )
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cultivos_umbral_radiacion'
        verbose_name = 'Umbral de Radiación Solar'
        verbose_name_plural = 'Umbrales de Radiación Solar'
    
    def __str__(self):
        return f"{self.variedad} - Radiación {self.radiacion_optima} W/m²"
    
    def evaluar_radiacion(self, radiacion_actual):
        """
        Evalúa el nivel de riesgo según la radiación actual.
        Retorna: (nivel_riesgo, mensaje, recomendacion)
        """
        if radiacion_actual < self.radiacion_minima:
            return ('bajo', 'Radiación muy baja', 'Radiación insuficiente - verificar nubosidad o exceso de sombra')
        elif radiacion_actual < self.radiacion_optima:
            return ('bajo', 'Radiación baja', 'Radiación por debajo de lo óptimo')
        elif radiacion_actual <= self.radiacion_maxima:
            return ('optimo', 'Radiación óptima', 'Condiciones de radiación ideales')
        else:
            return ('alto', 'Radiación excesiva', 'Radiación muy alta - riesgo de quemadura solar')


class LoteCafe(models.Model):
    NIVEL_SOMBRA_CHOICES = [
        ('Alto', 'Alto'),
        ('Medio', 'Medio'),
        ('Bajo', 'Bajo'),
    ]

    VARIEDAD_CHOICES = [
        ('Caturra', 'Caturra'),
        ('Castillo', 'Castillo'),
        ('Bourbon', 'Bourbon'),
        ('Típica', 'Típica'),
        ('Maragogipe', 'Maragogipe'),
        ('Tabí', 'Tabí'),
        ('Geisha', 'Geisha'),
        ('Otro', 'Otro'),
    ]

    DEPARTAMENTOS_COLOMBIA = [
        ('Antioquia', 'Antioquia'),
        ('Caldas', 'Caldas'),
        ('Risaralda', 'Risaralda'),
        ('Quindío', 'Quindío'),
        ('Valle del Cauca', 'Valle del Cauca'),
        ('Cundinamarca', 'Cundinamarca'),
        ('Huila', 'Huila'),
        ('Tolima', 'Tolima'),
        ('Cauca', 'Cauca'),
        ('Nariño', 'Nariño'),
        ('Santander', 'Santander'),
        ('Boyacá', 'Boyacá'),
        ('Otro', 'Otro'),
    ]

    # ✅ Cambiar esta línea - usar settings.AUTH_USER_MODEL
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lotes')

    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    departamento = models.CharField(max_length=50, choices=DEPARTAMENTOS_COLOMBIA, default='Antioquia')
    latitud = models.DecimalField(max_digits=9, decimal_places=3, null=True, blank=True)  # ✅ 3 decimales
    longitud = models.DecimalField(max_digits=9, decimal_places=3, null=True, blank=True)  # ✅ 3 decimales
    altitud = models.PositiveIntegerField(null=True, blank=True)
    variedad = models.CharField(max_length=20, choices=VARIEDAD_CHOICES, default='Castillo')
    hectareas = models.DecimalField(max_digits=5, decimal_places=2)
    nivel_sombra = models.CharField(max_length=10, choices=NIVEL_SOMBRA_CHOICES, default='Medio')
    arboles_hectarea = models.PositiveIntegerField(default=5000, null=True, blank=True)
    edad_plantacion = models.PositiveIntegerField(default=2, null=True, blank=True)
    fecha_siembra = models.DateField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lotes_cafe'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"{self.nombre} - {self.departamento}"

    def arboles_totales(self):
        return int(self.hectareas * self.arboles_hectarea)