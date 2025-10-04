
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from users.models import CustomUser

class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        token = request.data.get('token')
        password = request.data.get('password')
        try:
            user = CustomUser.objects.get(password_reset_token=token)
            user.set_password(password)
            user.password_reset_token = None
            user.save()
            return Response({'detail': 'Contraseña cambiada correctamente.'}, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({'detail': 'Token inválido o expirado.'}, status=status.HTTP_400_BAD_REQUEST)
