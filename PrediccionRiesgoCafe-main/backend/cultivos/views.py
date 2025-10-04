from rest_framework import viewsets, generics, permissions
from rest_framework.response import Response
from django.db.models import Count, Sum
from .models import LoteCafe
from .serializers import LoteCafeSerializer, LoteCafeCreateSerializer

class LoteCafeViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

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
        if self.action == 'create':
            return LoteCafeCreateSerializer
        return LoteCafeSerializer

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

class LotesUsuarioView(generics.ListAPIView):
    serializer_class = LoteCafeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LoteCafe.objects.filter(usuario=self.request.user)
