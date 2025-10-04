from rest_framework import serializers
from .models import CustomUser

import re

class UserSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo de usuario personalizado.
    Expone los campos relevantes para la API REST.
    Incluye el campo password como write_only para registro seguro.
    Valida email único y formato de teléfono.
    """
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone', 'is_active', 'is_staff', 'is_superuser', 'password', 'email_verified'
        ]
        read_only_fields = ['id', 'is_active', 'is_staff', 'is_superuser']

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError('Este email ya está registrado.')
        return value

    def validate_phone(self, value):
        # Valida formato internacional o nacional simple (ejemplo: 123456789, +34123456789)
        if value and not re.match(r'^(\+\d{1,3})?\d{7,15}$', value):
            raise serializers.ValidationError('Formato de teléfono inválido.')
        return value

    def create(self, validated_data):
        # El método create asegura que la contraseña se guarde hasheada
        password = validated_data.pop('password', None)
        user = CustomUser(**validated_data)
        if password:
            user.set_password(password)
        user.is_active = True  # Asegura que el usuario esté activo
        user.save()
        return user
