from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from users.models import CustomUser

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Permitir login por username o email
        username_or_email = attrs.get('username')
        password = attrs.get('password')
        user = None
        # Buscar por username
        try:
            user = CustomUser.objects.get(username=username_or_email)
        except CustomUser.DoesNotExist:
            # Buscar por email si no existe username
            try:
                user = CustomUser.objects.get(email=username_or_email)
            except CustomUser.DoesNotExist:
                pass
        from rest_framework.exceptions import AuthenticationFailed
        if user is not None and user.check_password(password):
            if not user.is_active or not user.email_verified:
                raise AuthenticationFailed('La cuenta debe ser activada. Revisa tu correo y haz clic en el enlace de activación.')
            attrs['username'] = user.username  # Forzar username para JWT
        return super().validate(attrs)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
