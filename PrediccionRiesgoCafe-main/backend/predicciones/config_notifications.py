# ========================================
# CONFIGURACIÓN DE SMS (TWILIO)
# ========================================
#
# Para activar el envío de SMS:
# 1. Instalar Twilio: pip install twilio
# 2. Crear cuenta en https://www.twilio.com/
# 3. Obtener credenciales del panel de Twilio
# 4. Descomentar y configurar las siguientes variables

# TWILIO_ACCOUNT_SID = 'tu_account_sid_aqui'
# TWILIO_AUTH_TOKEN = 'tu_auth_token_aqui'
# TWILIO_PHONE_NUMBER = '+1234567890'  # Tu número de Twilio

# ========================================
# CONFIGURACIÓN DE NOTIFICACIONES
# ========================================

# Nombre de la aplicación (usado en emails y SMS)
APP_NAME = 'Sistema de Cultivo de Café'

# Habilitar/deshabilitar notificaciones
NOTIFICATIONS_ENABLED = True
EMAIL_NOTIFICATIONS_ENABLED = True
SMS_NOTIFICATIONS_ENABLED = False  # Cambiar a True cuando se configure Twilio

# Configuración de emails
# Ya configurado en settings.py principal

