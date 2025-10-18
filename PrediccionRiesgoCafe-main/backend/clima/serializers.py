from rest_framework import serializers
from .models import DatosClimaticos

class DatosClimaticosSerializer(serializers.ModelSerializer):
    lote_nombre = serializers.CharField(source='lote.nombre', read_only=True)
    lote_departamento = serializers.CharField(source='lote.departamento', read_only=True)

    class Meta:
        model = DatosClimaticos
        fields = [
            'id', 'lote_nombre', 'lote_departamento',
            'fecha_registro', 'fecha_medicion',
            'irradiancia_solar', 'temperatura', 'humedad_relativa',
            'nubosidad', 'precipitacion', 'presion_atmosferica', 'velocidad_viento',
            'fuente_datos', 'calidad_datos', 'descripcion_clima', 'ciudad'
        ]
        read_only_fields = ['fecha_registro', 'calidad_datos', 'lote_nombre', 'lote_departamento']