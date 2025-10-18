from rest_framework import serializers
from .models import LoteCafe, UmbralRadiacionSolar

class UmbralRadiacionSolarSerializer(serializers.ModelSerializer):
    class Meta:
        model = UmbralRadiacionSolar
        fields = '__all__'
        read_only_fields = ('fecha_creacion', 'fecha_actualizacion')

class LoteCafeSerializer(serializers.ModelSerializer):
    usuario = serializers.StringRelatedField(read_only=True)
    arboles_totales = serializers.ReadOnlyField()
    # Incluir umbrales de radiación si están disponibles
    umbral_radiacion = serializers.SerializerMethodField()

    class Meta:
        model = LoteCafe
        fields = '__all__'
        read_only_fields = ('usuario', 'fecha_creacion', 'fecha_actualizacion')
    
    def get_umbral_radiacion(self, obj):
        """Obtener umbral de radiación según la variedad del lote"""
        try:
            umbral = UmbralRadiacionSolar.objects.get(variedad=obj.variedad)
            return UmbralRadiacionSolarSerializer(umbral).data
        except UmbralRadiacionSolar.DoesNotExist:
            return None

class LoteCafeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoteCafe
        exclude = ('usuario',)

    def create(self, validated_data):
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)