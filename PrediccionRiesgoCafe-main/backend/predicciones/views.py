from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count, Q
from django.utils import timezone
from datetime import timedelta

from .models import PrediccionRadiacion, HistorialPrediccion, ConfiguracionPrediccion
from .serializers import (
    PrediccionRadiacionSerializer, PrediccionRadiacionCreateSerializer,
    HistorialPrediccionSerializer, ConfiguracionPrediccionSerializer,
    EstadisticasPrediccionSerializer, ResultadoPrediccionSerializer
)
from .ml_service import servicio_ml
from .notifications import servicio_notificaciones
from cultivos.models import LoteCafe


class PrediccionRadiacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar predicciones de radiación solar
    """
    serializer_class = PrediccionRadiacionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar predicciones por usuario y aplicar filtros adicionales"""
        queryset = PrediccionRadiacion.objects.select_related('lote', 'usuario')
        
        # Filtrar por usuario si no es superuser
        if not self.request.user.is_superuser:
            queryset = queryset.filter(usuario=self.request.user)
        
        # Filtros adicionales
        lote_id = self.request.query_params.get('lote_id')
        if lote_id:
            queryset = queryset.filter(lote_id=lote_id)
        
        tipo_prediccion = self.request.query_params.get('tipo_prediccion')
        if tipo_prediccion:
            queryset = queryset.filter(tipo_prediccion=tipo_prediccion)
        
        metodo = self.request.query_params.get('metodo')
        if metodo:
            queryset = queryset.filter(metodo_utilizado=metodo)
        
        nivel_riesgo = self.request.query_params.get('nivel_riesgo')
        if nivel_riesgo:
            queryset = queryset.filter(nivel_riesgo_predicho=nivel_riesgo)
        
        # Filtro por fecha
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_desde:
            queryset = queryset.filter(fecha_generacion__date__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_generacion__date__lte=fecha_hasta)
        
        return queryset.order_by('-fecha_generacion')
    
    @action(detail=False, methods=['post'])
    def generar_prediccion(self, request):
        """
        Genera una nueva predicción usando ML
        """
        serializer = PrediccionRadiacionCreateSerializer(data=request.data)
        if serializer.is_valid():
            lote_id = serializer.validated_data['lote_id']
            tipo_prediccion = serializer.validated_data['tipo_prediccion']
            metodo_prediccion = serializer.validated_data['metodo_prediccion']
            
            try:
                lote = LoteCafe.objects.get(id=lote_id)
                
                # Verificar que el usuario tenga acceso al lote
                if not request.user.is_superuser and lote.usuario != request.user:
                    return Response(
                        {'error': 'No tienes permiso para este lote'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Generar predicción usando ML
                resultado = servicio_ml.generar_prediccion(
                    lote=lote,
                    usuario=request.user,
                    tipo_prediccion=tipo_prediccion,
                    metodo=metodo_prediccion
                )
                
                result_serializer = ResultadoPrediccionSerializer(data=resultado)
                if result_serializer.is_valid():
                    return Response(result_serializer.data, status=status.HTTP_201_CREATED)
                else:
                    return Response(result_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
            except LoteCafe.DoesNotExist:
                return Response(
                    {'error': 'Lote no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                return Response(
                    {'error': f'Error generando predicción: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """
        Obtiene estadísticas de las predicciones
        """
        try:
            # Filtrar por usuario si no es superuser
            queryset = PrediccionRadiacion.objects.all()
            if not request.user.is_superuser:
                queryset = queryset.filter(usuario=request.user)
            
            # Filtro opcional por lote
            lote_id = request.query_params.get('lote_id')
            if lote_id:
                queryset = queryset.filter(lote_id=lote_id)
            
            # Filtro por rango de fechas (últimos 30 días por defecto)
            fecha_desde = request.query_params.get('fecha_desde')
            if not fecha_desde:
                fecha_desde = timezone.now().date() - timedelta(days=30)
            else:
                from datetime import datetime
                fecha_desde = datetime.strptime(fecha_desde, '%Y-%m-%d').date()
            
            queryset = queryset.filter(fecha_generacion__date__gte=fecha_desde)
            
            # Estadísticas básicas
            total_predicciones = queryset.count()
            
            # Predicciones por método
            predicciones_por_metodo = dict(
                queryset.values('metodo_utilizado')
                .annotate(count=Count('id'))
                .values_list('metodo_utilizado', 'count')
            )
            
            # Predicciones por nivel de riesgo
            predicciones_por_riesgo = dict(
                queryset.values('nivel_riesgo_predicho')
                .annotate(count=Count('id'))
                .values_list('nivel_riesgo_predicho', 'count')
            )
            
            # Confianza promedio
            confianza_promedio = queryset.aggregate(
                promedio=Avg('confianza_prediccion')
            )['promedio'] or 0
            
            # Alertas generadas
            alertas_generadas = queryset.filter(alerta_generada=True).count()
            
            # Precisión promedio (si hay datos de historial)
            historial = HistorialPrediccion.objects.filter(
                prediccion_original__in=queryset
            )
            error_promedio = historial.aggregate(
                promedio=Avg('error_porcentual')
            )['promedio']
            
            # Precisiones por método
            precisiones_por_metodo = {}
            for metodo in ['random_forest', 'linear_regression', 'arima', 'ensemble']:
                error_metodo = historial.filter(
                    prediccion_original__metodo_utilizado=metodo
                ).aggregate(promedio=Avg('error_porcentual'))['promedio']
                
                if error_metodo is not None:
                    precisiones_por_metodo[metodo] = round(100 - error_metodo, 2)
            
            estadisticas = {
                'total_predicciones': total_predicciones,
                'predicciones_por_metodo': predicciones_por_metodo,
                'predicciones_por_riesgo': predicciones_por_riesgo,
                'confianza_promedio': round(confianza_promedio, 2),
                'alertas_generadas': alertas_generadas,
                'error_promedio': round(error_promedio, 2) if error_promedio else None,
                'precisiones_por_metodo': precisiones_por_metodo
            }
            
            serializer = EstadisticasPrediccionSerializer(data=estadisticas)
            if serializer.is_valid():
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response(
                {'error': f'Error obteniendo estadísticas: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def verificar_precision(self, request, pk=None):
        """
        Verifica la precisión de una predicción específica
        """
        prediccion = self.get_object()
        
        try:
            fecha_prediccion = prediccion.fecha_generacion.date()
            
            # Verificar cada día predicho
            resultados_verificacion = []
            
            if isinstance(prediccion.radiacion_predicha, list):
                for i, radiacion_predicha in enumerate(prediccion.radiacion_predicha):
                    fecha_verificacion = fecha_prediccion + timedelta(days=i+1)
                    
                    # Buscar datos reales para esa fecha
                    from clima.models import DatosClimaticos
                    dato_real = DatosClimaticos.objects.filter(
                        lote=prediccion.lote,
                        fecha_medicion__date=fecha_verificacion
                    ).first()
                    
                    if dato_real:
                        radiacion_real = float(dato_real.irradiancia_solar)
                        error_absoluto = abs(radiacion_real - radiacion_predicha)
                        error_porcentual = (error_absoluto / radiacion_real) * 100 if radiacion_real > 0 else 0
                        
                        # Crear o actualizar registro de historial
                        historial, created = HistorialPrediccion.objects.get_or_create(
                            prediccion_original=prediccion,
                            fecha_verificacion=fecha_verificacion,
                            defaults={
                                'radiacion_real': radiacion_real,
                                'radiacion_predicha': radiacion_predicha,
                                'error_absoluto': error_absoluto,
                                'error_porcentual': error_porcentual
                            }
                        )
                        
                        resultados_verificacion.append({
                            'dia': i + 1,
                            'fecha': fecha_verificacion,
                            'radiacion_real': radiacion_real,
                            'radiacion_predicha': radiacion_predicha,
                            'error_absoluto': round(error_absoluto, 2),
                            'error_porcentual': round(error_porcentual, 2),
                            'nuevo_registro': created
                        })
            
            return Response({
                'prediccion_id': prediccion.id,
                'verificaciones': resultados_verificacion,
                'total_verificaciones': len(resultados_verificacion)
            })
            
        except Exception as e:
            return Response(
                {'error': f'Error verificando precisión: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reenviar_notificacion(self, request, pk=None):
        """
        Reenvía la notificación de una predicción existente
        """
        prediccion = self.get_object()

        try:
            # Verificar que el usuario tenga acceso
            if not request.user.is_superuser and prediccion.usuario != request.user:
                return Response(
                    {'error': 'No tienes permiso para esta predicción'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Enviar notificación
            resultado = servicio_notificaciones.enviar_alerta_prediccion(
                prediccion,
                prediccion.usuario,
                prediccion.lote
            )

            return Response({
                'mensaje': 'Notificación reenviada',
                'email_enviado': resultado['email_enviado'],
                'sms_enviado': resultado['sms_enviado'],
                'errores': resultado['errores']
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Error reenviando notificación: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def entrenar_modelo(self, request):
        """
        Re-entrena el modelo para un lote específico
        """
        lote_id = request.data.get('lote_id')
        metodo = request.data.get('metodo', 'random_forest')
        dias_datos = request.data.get('dias_datos', 90)
        
        if not lote_id:
            return Response(
                {'error': 'lote_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lote = LoteCafe.objects.get(id=lote_id)
            
            # Verificar permisos
            if not request.user.is_superuser and lote.usuario != request.user:
                return Response(
                    {'error': 'No tienes permiso para este lote'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Entrenar modelo
            resultado = servicio_ml.entrenar_modelo_para_lote(
                lote=lote,
                metodo=metodo,
                dias_datos=dias_datos
            )
            
            return Response(resultado)
            
        except LoteCafe.DoesNotExist:
            return Response(
                {'error': 'Lote no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error entrenando modelo: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HistorialPrediccionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para historial de precisión
    """
    serializer_class = HistorialPrediccionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = HistorialPrediccion.objects.select_related(
            'prediccion_original__lote', 
            'prediccion_original__usuario'
        )
        
        # Filtrar por usuario si no es superuser
        if not self.request.user.is_superuser:
            queryset = queryset.filter(prediccion_original__usuario=self.request.user)
        
        # Filtros adicionales
        prediccion_id = self.request.query_params.get('prediccion_id')
        if prediccion_id:
            queryset = queryset.filter(prediccion_original_id=prediccion_id)
        
        lote_id = self.request.query_params.get('lote_id')
        if lote_id:
            queryset = queryset.filter(prediccion_original__lote_id=lote_id)
        
        return queryset.order_by('-fecha_verificacion')


class ConfiguracionPrediccionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para configuración de predicciones (solo admin)
    """
    serializer_class = ConfiguracionPrediccionSerializer
    queryset = ConfiguracionPrediccion.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """
        Solo superusers pueden modificar la configuración
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
            return [permission() for permission in permission_classes]
        else:
            permission_classes = [IsAuthenticated]
            return [permission() for permission in permission_classes]
    
    def create(self, request, *args, **kwargs):
        """Solo permitir una configuración"""
        if ConfiguracionPrediccion.objects.exists() and not request.user.is_superuser:
            return Response(
                {'error': 'Ya existe una configuración. Solo administradores pueden crear otra.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
