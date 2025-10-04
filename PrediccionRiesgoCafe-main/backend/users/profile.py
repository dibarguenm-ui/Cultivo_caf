
from rest_framework import generics, permissions
from rest_framework.permissions import BasePermission
from .serializers import UserSerializer

# Permiso personalizado: solo el usuario dueño puede editar su perfil
class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Solo permite métodos de lectura para cualquier usuario autenticado
        if request.method in permissions.SAFE_METHODS:
            return True
        # Solo el dueño puede editar su perfil
        return obj == request.user

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Endpoint para consultar y editar el perfil del usuario autenticado.
    Solo el usuario dueño puede acceder y modificar su información.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_object(self):
        return self.request.user
