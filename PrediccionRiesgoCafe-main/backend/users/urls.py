from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet
from .register import RegisterUserView
from .profile import UserProfileView
## Eliminado flujo de verificación por código
from .activate import ActivateAccountView
from .password_reset import PasswordResetRequestView
from .password_reset_confirm import PasswordResetConfirmView

# Router para la API de usuarios
router = DefaultRouter()
router.register(r'users', UserViewSet)

from rest_framework_simplejwt.views import TokenRefreshView
from .custom_auth import CustomTokenObtainPairView

urlpatterns = [
    path('', include(router.urls)),
    # Endpoints para autenticación JWT
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Endpoint para registro de usuario
    path('auth/register/', RegisterUserView.as_view(), name='register'),
    # Endpoint para activación de cuenta por enlace
    path('auth/activate/<str:token>/', ActivateAccountView.as_view(), name='activate_account'),
    # Endpoint para recuperación de contraseña
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('auth/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    # Endpoint para perfil del usuario autenticado
    path('auth/profile/', UserProfileView.as_view(), name='user_profile'),

]
