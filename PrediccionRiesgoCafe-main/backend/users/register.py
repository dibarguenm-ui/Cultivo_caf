from rest_framework import generics, permissions
from .models import CustomUser
from .serializers import UserSerializer
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
import random

class RegisterUserView(generics.CreateAPIView):
    """
    Endpoint para registrar nuevos usuarios.
    Genera código de verificación y envía email al usuario.
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        from django.conf import settings
        import uuid
        user = serializer.save(is_active=False)
        # Generar token único
        token = str(uuid.uuid4())
        user.verification_token = token
        user.save()
        # Enviar email con enlace
        activation_link = f"http://localhost:8000/api/auth/activate/{token}/"
        send_mail(
            'Activa tu cuenta',
            f'Por favor haz clic en el siguiente enlace para activar tu cuenta:\n{activation_link}',
            settings.EMAIL_HOST_USER,
            [user.email],
            fail_silently=False,
        )
