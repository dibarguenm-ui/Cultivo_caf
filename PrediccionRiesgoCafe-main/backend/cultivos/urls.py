from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoteCafeViewSet, LotesUsuarioView

router = DefaultRouter()
router.register(r'lotes', LoteCafeViewSet, basename='lote')

urlpatterns = [
    path('', include(router.urls)),
    path('mis-lotes/', LotesUsuarioView.as_view(), name='mis_lotes'),
    path('estadisticas/', LoteCafeViewSet.as_view({'get': 'estadisticas'}), name='estadisticas'),
]
