from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PrediccionRadiacionViewSet,
    HistorialPrediccionViewSet,
    ConfiguracionPrediccionViewSet
)

router = DefaultRouter()
router.register(r'predicciones', PrediccionRadiacionViewSet, basename='prediccion')
router.register(r'historial', HistorialPrediccionViewSet, basename='historial')
router.register(r'configuracion', ConfiguracionPrediccionViewSet, basename='configuracion')

urlpatterns = [
    path('', include(router.urls)),
]