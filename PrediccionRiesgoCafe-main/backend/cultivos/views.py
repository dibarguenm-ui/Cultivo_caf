from rest_framework import viewsets, generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Sum
from .models import LoteCafe, UmbralRadiacionSolar
from .serializers import LoteCafeSerializer, LoteCafeCreateSerializer, UmbralRadiacionSolarSerializer


class UmbralRadiacionSolarViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para obtener umbrales de radiación solar por variedad.
    Solo lectura - los datos se cargan desde la administración.
    No requiere autenticación (información pública)
    """
    queryset = UmbralRadiacionSolar.objects.all()
    serializer_class = UmbralRadiacionSolarSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['get'])
    def por_variedad(self, request):
        """Obtener umbral para una variedad específica"""
        variedad = request.query_params.get('variedad')
        if not variedad:
            return Response({'error': 'Parámetro variedad requerido'}, status=400)
        
        try:
            umbral = UmbralRadiacionSolar.objects.get(variedad=variedad)
            return Response(UmbralRadiacionSolarSerializer(umbral).data)
        except UmbralRadiacionSolar.DoesNotExist:
            return Response({'error': f'Umbral no encontrado para variedad {variedad}'}, status=404)
    
    @action(detail=False, methods=['get'])
    def todas_variedades(self, request):
        """Obtener todos los umbrales disponibles"""
        umbrales = UmbralRadiacionSolar.objects.all()
        return Response(UmbralRadiacionSolarSerializer(umbrales, many=True).data)


class LoteCafeViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = LoteCafe.objects.all()
    serializer_class = LoteCafeSerializer

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Endpoint simple de estadísticas"""
        lotes_count = LoteCafe.objects.filter(usuario=request.user).count()
        return Response({
            'total_lotes': lotes_count,
            'mensaje': 'Estadísticas básicas'
        })

    def get_queryset(self):
        return LoteCafe.objects.filter(usuario=self.request.user)

    def get_serializer_class(self):
        if getattr(self, 'action', None) == 'create':
            return LoteCafeCreateSerializer
        return LoteCafeSerializer

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class LotesUsuarioView(generics.ListAPIView):
    serializer_class = LoteCafeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LoteCafe.objects.filter(usuario=self.request.user)
