from rest_framework import serializers
from .models import LoteCafe

class LoteCafeSerializer(serializers.ModelSerializer):
    usuario = serializers.StringRelatedField(read_only=True)
    arboles_totales = serializers.ReadOnlyField()

    class Meta:
        model = LoteCafe
        fields = '__all__'
        read_only_fields = ('usuario', 'fecha_creacion', 'fecha_actualizacion')

class LoteCafeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoteCafe
        exclude = ('usuario',)

    def create(self, validated_data):
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)