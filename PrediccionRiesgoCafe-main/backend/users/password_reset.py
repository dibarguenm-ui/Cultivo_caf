from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from users.models import CustomUser
from django.conf import settings
import uuid

from rest_framework import permissions

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'Debe proporcionar un correo electrónico.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({'detail': 'El correo no está registrado.'}, status=status.HTTP_404_NOT_FOUND)
        token = str(uuid.uuid4())
        user.password_reset_token = token
        user.save()
        reset_link = f"http://localhost:3000/reset-password/{token}"
        send_mail(
            'Recuperación de contraseña',
            f'Por favor haz clic en el siguiente enlace para restablecer tu contraseña:\n{reset_link}',
            settings.EMAIL_HOST_USER,
            [user.email],
            fail_silently=False,
        )
        return Response({'detail': 'Correo enviado.'}, status=status.HTTP_200_OK)
