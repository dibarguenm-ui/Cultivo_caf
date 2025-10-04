# backend/clima/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import datetime, timedelta

from .models import DatosClimaticos
from .serializers import DatosClimaticosSerializer  # SOLO este serializer
from .services import ServicioDatosClimaticos
from cultivos.models import LoteCafe

class DatosClimaticosViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de datos climáticos
    """
    serializer_class = DatosClimaticosSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Solo datos climáticos de los lotes del usuario"""
        return DatosClimaticos.objects.filter(
            lote__usuario=self.request.user
        ).select_related('lote').order_by('-fecha_registro')

# backend/clima/views.py - en la función actualizar_lote
@action(detail=False, methods=['post'])
def actualizar_lote(self, request):
    """Actualiza datos climáticos para un lote específico"""
    lote_id = request.data.get('lote_id')

    print(f"🔍 DEBUG: Solicitando actualización para lote {lote_id}")

    try:
        lote = LoteCafe.objects.get(id=lote_id, usuario=request.user)
        print(f"🔍 DEBUG: Lote encontrado: {lote.nombre} en {lote.municipio}")

        servicio = ServicioDatosClimaticos()

        datos = servicio.obtener_datos_actuales(lote)
        print(f"🔍 DEBUG: Datos obtenidos: {datos}")

        if datos:
            dato_climatico = DatosClimaticos.objects.create(
                lote=lote,
                **datos
            )
            print(f"✅ DEBUG: Registro creado en BD - ID: {dato_climatico.id}")

            serializer = self.get_serializer(dato_climatico)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {'error': 'No se pudieron obtener datos climáticos'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

    except LoteCafe.DoesNotExist:
        print(f"❌ DEBUG: Lote {lote_id} no encontrado")
        return Response(
            {'error': 'Lote no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )

    @action(detail=False, methods=['get'])
    def ultimos_datos(self, request):
        """Obtiene los últimos datos climáticos de todos los lotes del usuario"""
        lotes_usuario = LoteCafe.objects.filter(usuario=request.user)
        ultimos_datos = []

        for lote in lotes_usuario:
            ultimo_dato = DatosClimaticos.objects.filter(lote=lote).order_by('-fecha_registro').first()
            if ultimo_dato:
                ultimos_datos.append(ultimo_dato)

        serializer = self.get_serializer(ultimos_datos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def historico(self, request, pk=None):
        """Obtiene histórico de datos climáticos para un lote específico"""
        try:
            dias = int(request.query_params.get('dias', 7))
            fecha_inicio = timezone.now() - timedelta(days=dias)

            datos_historicos = DatosClimaticos.objects.filter(
                lote_id=pk,
                lote__usuario=request.user,
                fecha_registro__gte=fecha_inicio
            ).order_by('fecha_registro')

            serializer = self.get_serializer(datos_historicos, many=True)
            return Response(serializer.data)

        except LoteCafe.DoesNotExist:
            return Response(
                {'error': 'Lote no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

class DashboardClimaViewSet(viewsets.ViewSet):
    """
    ViewSet para dashboard climático
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def resumen_actual(self, request):
        """Resumen climático actual de todos los lotes"""
        lotes = LoteCafe.objects.filter(usuario=request.user)
        resumen = []

        for lote in lotes:
            ultimo_dato = DatosClimaticos.objects.filter(lote=lote).order_by('-fecha_registro').first()
            if ultimo_dato:
                resumen.append({
                    'lote_id': lote.id,
                    'lote_nombre': lote.nombre,
                    'lote_municipio': lote.municipio,
                    'temperatura': float(ultimo_dato.temperatura),
                    'humedad': float(ultimo_dato.humedad_relativa),
                    'irradiancia': float(ultimo_dato.irradiancia_solar),
                    'precipitacion': float(ultimo_dato.precipitacion) if ultimo_dato.precipitacion else 0,
                    'calidad_datos': ultimo_dato.calidad_datos,
                    'ultima_actualizacion': ultimo_dato.fecha_registro
                })
            else:
                # Datos de ejemplo si no hay datos reales
                resumen.append({
                    'lote_id': lote.id,
                    'lote_nombre': lote.nombre,
                    'lote_municipio': lote.municipio,
                    'temperatura': 28.0,
                    'humedad': 75.0,
                    'irradiancia': 850.0,
                    'precipitacion': 0.0,
                    'calidad_datos': 'media',
                    'ultima_actualizacion': timezone.now()
                })

        return Response(resumen)