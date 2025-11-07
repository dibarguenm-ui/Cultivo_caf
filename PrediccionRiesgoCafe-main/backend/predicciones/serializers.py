from rest_framework import serializers
from .models import PrediccionRadiacion, HistorialPrediccion, ConfiguracionPrediccion
from cultivos.serializers import LoteCafeSerializer
from users.serializers import UserSerializer


class PrediccionRadiacionSerializer(serializers.ModelSerializer):
    lote = LoteCafeSerializer(read_only=True)
    usuario = UserSerializer(read_only=True)
    lote_id = serializers.IntegerField(write_only=True)
    usuario_id = serializers.IntegerField(write_only=True, required=False)
    
    # Campos calculados
    prediccion_promedio = serializers.SerializerMethodField()
    dias_predichos = serializers.SerializerMethodField()
    
    class Meta:
        model = PrediccionRadiacion
        fields = [
            'id', 'lote', 'usuario', 'lote_id', 'usuario_id',
            'tipo_prediccion', 'metodo_utilizado',
            'fecha_generacion', 'radiacion_actual', 'temperatura_actual', 'humedad_actual',
            'radiacion_predicha', 'confianza_prediccion', 'datos_historicos_usados',
            'r2_score', 'mae_score', 'alerta_generada', 'nivel_riesgo_predicho',
            'fecha_actualizacion', 'prediccion_promedio', 'dias_predichos'
        ]
        read_only_fields = [
            'id', 'fecha_generacion', 'fecha_actualizacion',
            'r2_score', 'mae_score', 'datos_historicos_usados'
        ]
    
    def get_prediccion_promedio(self, obj):
        return obj.get_prediccion_promedio()
    
    def get_dias_predichos(self, obj):
        return obj.get_dias_predichos()
    
    def validate_radiacion_predicha(self, value):
        """Validar que radiacion_predicha sea una lista válida"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Las predicciones deben ser una lista de valores")
        
        if len(value) == 0:
            raise serializers.ValidationError("Debe haber al menos una predicción")
        
        for pred in value:
            if not isinstance(pred, (int, float)) or pred < 0:
                raise serializers.ValidationError("Todas las predicciones deben ser números positivos")
        
        return value
    
    def validate_confianza_prediccion(self, value):
        """Validar que la confianza esté entre 0 y 100"""
        if value < 0 or value > 100:
            raise serializers.ValidationError("La confianza debe estar entre 0 y 100")
        return value


class PrediccionRadiacionCreateSerializer(serializers.Serializer):
    """
    Serializer para crear nuevas predicciones
    """
    lote_id = serializers.IntegerField()
    tipo_prediccion = serializers.ChoiceField(
        choices=PrediccionRadiacion.TIPO_PREDICCION_CHOICES,
        default='3_dias'
    )
    metodo_prediccion = serializers.ChoiceField(
        choices=PrediccionRadiacion.METODO_PREDICCION_CHOICES,
        default='random_forest'
    )
    
    def validate_lote_id(self, value):
        """Validar que el lote existe"""
        from cultivos.models import LoteCafe
        try:
            LoteCafe.objects.get(id=value)
        except LoteCafe.DoesNotExist:
            raise serializers.ValidationError("El lote especificado no existe")
        return value


class HistorialPrediccionSerializer(serializers.ModelSerializer):
    prediccion_original = PrediccionRadiacionSerializer(read_only=True)
    
    class Meta:
        model = HistorialPrediccion
        fields = [
            'id', 'prediccion_original', 'fecha_verificacion',
            'radiacion_real', 'radiacion_predicha', 'error_absoluto',
            'error_porcentual', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


class ConfiguracionPrediccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracionPrediccion
        fields = [
            'id', 'dias_historicos_minimos', 'dias_historicos_recomendados',
            'confianza_minima_alerta', 'reentrenar_cada_dias', 'max_error_aceptable',
            'generar_predicciones_automaticas', 'hora_generacion_automatica',
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']
    
    def validate_dias_historicos_minimos(self, value):
        if value < 7:
            raise serializers.ValidationError("Mínimo 7 días históricos requeridos")
        return value
    
    def validate_dias_historicos_recomendados(self, value):
        if value < 30:
            raise serializers.ValidationError("Se recomiendan al menos 30 días históricos")
        return value
    
    def validate_confianza_minima_alerta(self, value):
        if value < 50 or value > 100:
            raise serializers.ValidationError("La confianza mínima debe estar entre 50 y 100")
        return value
    
    def validate_max_error_aceptable(self, value):
        if value < 5 or value > 50:
            raise serializers.ValidationError("El error máximo debe estar entre 5 y 50 por ciento")
        return value


class EstadisticasPrediccionSerializer(serializers.Serializer):
    """
    Serializer para estadísticas de predicciones
    """
    total_predicciones = serializers.IntegerField()
    predicciones_por_metodo = serializers.DictField()
    predicciones_por_riesgo = serializers.DictField()
    confianza_promedio = serializers.DecimalField(max_digits=5, decimal_places=2)
    alertas_generadas = serializers.IntegerField()
    error_promedio = serializers.DecimalField(max_digits=6, decimal_places=2, required=False)
    precisiones_por_metodo = serializers.DictField(required=False)


class ResultadoPrediccionSerializer(serializers.Serializer):
    """
    Serializer para el resultado de generar una predicción
    """
    exito = serializers.BooleanField()
    prediccion_id = serializers.IntegerField(required=False)
    predicciones = serializers.ListField(
        child=serializers.DecimalField(max_digits=7, decimal_places=2),
        required=False
    )
    confianza = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)
    nivel_riesgo = serializers.CharField(required=False)
    alerta_generada = serializers.BooleanField(required=False)
    metodo_utilizado = serializers.CharField(required=False)
    datos_historicos = serializers.IntegerField(required=False)
    error = serializers.CharField(required=False)