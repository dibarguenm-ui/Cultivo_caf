# backend/clima/urls.py - Crear este archivo si no existe
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DatosClimaticosViewSet, DashboardClimaViewSet

router = DefaultRouter()
router.register(r'datos-climaticos', DatosClimaticosViewSet, basename='datos-climaticos')
router.register(r'dashboard', DashboardClimaViewSet, basename='dashboard-clima')

urlpatterns = [
    path('', include(router.urls)),
]