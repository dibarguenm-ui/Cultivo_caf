from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings  # ✅ Importar así para evitar circular

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
    municipio = models.CharField(max_length=100)
    latitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    variedad = models.CharField(max_length=20, choices=VARIEDAD_CHOICES, default='Castillo')
    hectareas = models.DecimalField(max_digits=5, decimal_places=2)
    nivel_sombra = models.CharField(max_length=10, choices=NIVEL_SOMBRA_CHOICES, default='Medio')
    altitud = models.PositiveIntegerField()
    arboles_hectarea = models.PositiveIntegerField(default=5000)
    edad_plantacion = models.PositiveIntegerField(default=2)
    fecha_siembra = models.DateField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lotes_cafe'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"{self.nombre} - {self.municipio}"

    def arboles_totales(self):
        return int(self.hectareas * self.arboles_hectarea)