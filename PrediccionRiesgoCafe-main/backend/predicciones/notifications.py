"""
Sistema de Notificaciones para Predicciones Climáticas
Envía alertas por email y SMS cuando se genera una predicción
"""

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class ServicioNotificaciones:
    """
    Servicio centralizado para envío de notificaciones
    """

    def __init__(self):
        self.app_name = getattr(settings, 'APP_NAME', 'Sistema de Cultivo de Café')
        self.from_email = settings.EMAIL_HOST_USER

    def enviar_alerta_prediccion(self, prediccion, usuario, lote):
        """
        Envía alerta de predicción por email y opcionalmente SMS

        Args:
            prediccion: Objeto PrediccionRadiacion
            usuario: Objeto CustomUser
            lote: Objeto LoteCafe

        Returns:
            dict: Resultado del envío con estado de cada canal
        """
        resultado = {
            'email_enviado': False,
            'sms_enviado': False,
            'errores': []
        }

        try:
            # Preparar datos para el template
            context = self._preparar_contexto(prediccion, usuario, lote)

            # Enviar email
            email_result = self._enviar_email(usuario.email, context)
            resultado['email_enviado'] = email_result

            # Enviar SMS si el usuario tiene teléfono configurado
            if usuario.phone:
                sms_result = self._enviar_sms(usuario.phone, context)
                resultado['sms_enviado'] = sms_result

            logger.info(f"Notificación enviada - Predicción {prediccion.id} - Usuario {usuario.username}")

        except Exception as e:
            error_msg = f"Error enviando notificación: {str(e)}"
            logger.error(error_msg)
            resultado['errores'].append(error_msg)

        return resultado

    def _preparar_contexto(self, prediccion, usuario, lote):
        """
        Prepara el contexto para los templates de notificación
        """
        # Calcular predicción promedio
        prediccion_promedio = prediccion.get_prediccion_promedio()

        # Determinar icono de riesgo
        iconos_riesgo = {
            'bajo': '✅',
            'medio': '⚠️',
            'alto': '🔴',
            'critico': '🚨'
        }

        return {
            'app_name': self.app_name,
            'usuario': usuario,
            'lote': lote,
            'prediccion': prediccion,
            'fecha': timezone.now().strftime('%d/%m/%Y %H:%M'),
            'prediccion_promedio': round(prediccion_promedio, 2),
            'dias_predichos': prediccion.get_dias_predichos(),
            'icono_riesgo': iconos_riesgo.get(prediccion.nivel_riesgo_predicho, '❓'),
            'tiene_alerta': prediccion.alerta_generada,
            'nivel_riesgo': prediccion.nivel_riesgo_predicho,
            'radiacion_predicha_lista': prediccion.radiacion_predicha if isinstance(prediccion.radiacion_predicha, list) else [],
            # Datos adicionales del lote
            'arboles_totales': lote.arboles_totales() if hasattr(lote, 'arboles_totales') else 'N/A',
            'region_cafetera': lote.get_region_cafetera() if hasattr(lote, 'get_region_cafetera') else 'N/A',
        }

    def _enviar_email(self, destinatario, context):
        """
        Envía email HTML con la alerta de predicción
        """
        try:
            # Asunto del email
            asunto = f"🌤️ Nueva Predicción Climática - {context['lote'].nombre}"

            if context['tiene_alerta']:
                asunto = f"🚨 ALERTA: {asunto}"

            # Renderizar templates
            texto_plano = render_to_string('emails/prediccion_alert.txt', context)
            html_contenido = render_to_string('emails/prediccion_alert.html', context)

            # Crear email
            email = EmailMultiAlternatives(
                subject=asunto,
                body=texto_plano,
                from_email=self.from_email,
                to=[destinatario]
            )

            # Adjuntar versión HTML
            email.attach_alternative(html_contenido, "text/html")

            # Enviar
            email.send(fail_silently=False)

            logger.info(f"Email enviado exitosamente a {destinatario}")
            return True

        except Exception as e:
            logger.error(f"Error enviando email a {destinatario}: {str(e)}")
            return False

    def _enviar_sms(self, telefono, context):
        """
        Envía SMS con resumen de la predicción

        Para implementar con Twilio:
        1. pip install twilio
        2. Configurar TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN en settings
        3. Descomentar código
        """
        try:
            # Preparar mensaje corto para SMS (max 160 caracteres)
            mensaje = self._generar_mensaje_sms(context)

            logger.info(f"📱 SMS preparado para {telefono}: {mensaje}")

            # TODO: Descomentar cuando se configure Twilio
            """
            from twilio.rest import Client
            
            client = Client(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN
            )
            
            message = client.messages.create(
                body=mensaje,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=telefono
            )
            
            logger.info(f"SMS enviado exitosamente - SID: {message.sid}")
            return True
            """

            # Por ahora, solo registrar en log
            logger.info(f"SMS simulado (Twilio no configurado): {telefono}")
            return False

        except Exception as e:
            logger.error(f"Error enviando SMS a {telefono}: {str(e)}")
            return False

    def _generar_mensaje_sms(self, context):
        """
        Genera mensaje corto para SMS (max 160 caracteres)
        """
        pred = context['prediccion']
        lote = context['lote']

        if context['tiene_alerta']:
            mensaje = f"🚨ALERTA {pred.nivel_riesgo_predicho.upper()}: "
        else:
            mensaje = f"Predicción {lote.nombre}: "

        mensaje += f"Radiación {context['prediccion_promedio']}W/m² "
        mensaje += f"({pred.get_dias_predichos()}d). "
        mensaje += f"Confianza {pred.confianza_prediccion}%"

        return mensaje[:160]  # Limitar a 160 caracteres

    def enviar_alerta_riesgo_critico(self, prediccion, usuario, lote):
        """
        Envía alerta especial para riesgos críticos
        Puede ser más urgente y con más detalles
        """
        logger.warning(f"⚠️ ALERTA CRÍTICA - Predicción {prediccion.id} - Lote {lote.nombre}")

        # Enviar notificación normal
        resultado = self.enviar_alerta_prediccion(prediccion, usuario, lote)

        # TODO: Aquí podrías agregar lógica adicional para alertas críticas:
        # - Enviar a múltiples destinatarios
        # - Enviar a un número de emergencia
        # - Registrar en sistema de monitoreo
        # - Crear ticket de soporte

        return resultado


# Instancia global del servicio
servicio_notificaciones = ServicioNotificaciones()

