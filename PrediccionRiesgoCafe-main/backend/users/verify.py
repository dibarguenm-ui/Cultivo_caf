from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import CustomUser

class VerifyEmailView(APIView):
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        try:
            user = CustomUser.objects.get(email=email, verification_code=code)
            user.email_verified = True
            user.is_active = True
            user.verification_code = None
            user.save()
            return Response({'detail': 'Cuenta verificada correctamente.'}, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({'detail': 'Código o email incorrecto.'}, status=status.HTTP_400_BAD_REQUEST)
