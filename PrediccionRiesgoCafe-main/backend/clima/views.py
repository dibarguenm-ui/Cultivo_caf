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
        # Siempre hacer una nueva consulta a la BD, nunca cachear
        queryset = DatosClimaticos.objects.filter(
            lote__usuario=self.request.user
        ).select_related('lote').order_by('-fecha_registro').all()
        
        # Filtrar por lote específico si se proporciona en query params
        lote_id = self.request.query_params.get('lote')
        if lote_id:
            queryset = queryset.filter(lote_id=lote_id)
        
        print(f"\n🔍 DEBUG [get_queryset]: Lote={lote_id}, Registros encontrados={queryset.count()}")
        if queryset.exists():
            ultimos = queryset[:3]
            for item in ultimos:
                print(f"   - ID: {item.id}, Fecha: {item.fecha_registro}, Temp: {item.temperatura}°C")
        
        return queryset

    def list(self, request, *args, **kwargs):
        """Sobrescribir list() para forzar que nunca cachee"""
        print(f"\n📡 DEBUG [list]: GET {request.path} - Forzando lectura DIRECTA de BD")
        
        # Forzar que get_queryset() se ejecute de nuevo
        queryset = self.get_queryset()
        
        # Serializar los datos
        serializer = self.get_serializer(queryset, many=True)
        print(f"📡 DEBUG [list]: Retornando {len(serializer.data)} registros")
        
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def actualizar_lote(self, request):
        """Actualiza datos climáticos para un lote específico"""
        lote_id = request.data.get('lote_id')

        print(f"\n🔍 ===== INICIO ACTUALIZACIÓN CLIMA =====")
        print(f"🔍 DEBUG: Solicitando actualización para lote {lote_id}")
        print(f"🔍 Usuario: {request.user.username}")

        try:
            lote = LoteCafe.objects.get(id=lote_id, usuario=request.user)
            print(f"🔍 DEBUG: Lote encontrado: {lote.nombre} en {lote.departamento}")

            servicio = ServicioDatosClimaticos()

            datos = servicio.obtener_datos_actuales(lote)
            print(f"🔍 DEBUG: Datos obtenidos: {datos}")

            if datos:
                # Asegurar que cada medición sea guardada como un registro INDIVIDUAL
                dato_climatico = DatosClimaticos.objects.create(
                    lote=lote,
                    **datos
                )
                print(f"✅ DEBUG: Registro creado en BD - ID: {dato_climatico.id}")
                print(f"✅ DEBUG: Temperatura guardada: {dato_climatico.temperatura}°C")
                print(f"✅ DEBUG: Fecha de medición: {dato_climatico.fecha_medicion}")
                print(f"✅ DEBUG: Fecha de registro: {dato_climatico.fecha_registro}")
                print(f"✅ DEBUG: Irradiancia: {dato_climatico.irradiancia_solar} W/m²")

                # Verificar que el registro fue guardado correctamente
                registro_verificado = DatosClimaticos.objects.filter(id=dato_climatico.id).first()
                if registro_verificado:
                    print(f"✅ DEBUG: Registro verificado en BD ✓")
                else:
                    print(f"❌ DEBUG: Error al verificar registro en BD ✗")

                serializer = self.get_serializer(dato_climatico)
                print(f"✅ ===== FIN ACTUALIZACIÓN EXITOSA =====\n")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                print(f"❌ DEBUG: No se obtuvieron datos")
                print(f"❌ ===== FIN ACTUALIZACIÓN FALLIDA =====\n")
                return Response(
                    {'error': 'No se pudieron obtener datos climáticos'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

        except LoteCafe.DoesNotExist:
            print(f"❌ DEBUG: Lote {lote_id} no encontrado para usuario {request.user.username}")
            print(f"❌ ===== FIN ACTUALIZACIÓN FALLIDA =====\n")
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
            ).order_by('-fecha_registro')  # Ordenar por fecha descendente (más reciente primero)

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
                    'lote_departamento': lote.departamento,
                    'temperatura': float(ultimo_dato.temperatura),
                    'humedad': float(ultimo_dato.humedad_relativa),
                    'irradiancia': float(ultimo_dato.irradiancia_solar),
                    'precipitacion': float(ultimo_dato.precipitacion) if ultimo_dato.precipitacion else 0,
                    'calidad_datos': ultimo_dato.calidad_datos,
                    'ultima_actualizacion': ultimo_dato.fecha_registro
                })
            # NO incluir datos de ejemplo, solo mostrar si hay datos reales

        return Response(resumen)