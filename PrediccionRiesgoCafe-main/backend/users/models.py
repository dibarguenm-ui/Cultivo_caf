
from django.db import models
from django.contrib.auth.models import AbstractUser

# Modelo de usuario personalizado
# Extiende el modelo base de Django para permitir campos adicionales
class CustomUser(AbstractUser):
	"""
	Modelo de usuario personalizado para la aplicación.
	Puedes agregar aquí los campos adicionales definidos en el modelo relacional.
	Ejemplo: teléfono, rol, etc.
	"""
	phone = models.CharField(max_length=20, blank=True, null=True, help_text="Teléfono de contacto")
	email_verified = models.BooleanField(default=False)
	verification_token = models.CharField(max_length=64, blank=True, null=True)
	password_reset_token = models.CharField(max_length=64, blank=True, null=True)

	def __str__(self):
		return self.username
