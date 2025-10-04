
from rest_framework import viewsets, permissions
from .models import CustomUser
from .serializers import UserSerializer

# Vista API para gestión de usuarios
class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo de usuario personalizado.
    Permite listar, crear, editar y eliminar usuarios mediante la API REST.
    Se puede extender para agregar permisos y lógica personalizada.
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

# Aquí puedes personalizar los métodos para registro, edición, etc.