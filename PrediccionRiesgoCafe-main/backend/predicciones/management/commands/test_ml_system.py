"""
Comando para probar el sistema de predicciones ML
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from cultivos.models import LoteCafe
from predicciones.ml_service import servicio_ml

User = get_user_model()


class Command(BaseCommand):
    help = 'Prueba el sistema de predicciones ML'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--lote-id',
            type=int,
            help='ID del lote para probar predicción'
        )
        parser.add_argument(
            '--usuario-id',
            type=int,
            help='ID del usuario para la predicción'
        )
    
    def handle(self, *args, **options):
        self.stdout.write('🔬 Iniciando prueba del sistema de predicciones ML...\n')
        
        # Verificar lote
        lote_id = options.get('lote_id')
        usuario_id = options.get('usuario_id')
        
        if not lote_id:
            # Usar el primer lote disponible
            lote = LoteCafe.objects.first()
            if not lote:
                self.stdout.write(
                    self.style.ERROR('❌ No hay lotes disponibles para prueba')
                )
                return
        else:
            try:
                lote = LoteCafe.objects.get(id=lote_id)
            except LoteCafe.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'❌ Lote con ID {lote_id} no encontrado')
                )
                return
        
        # Verificar usuario
        if not usuario_id:
            usuario = User.objects.first()
            if not usuario:
                self.stdout.write(
                    self.style.ERROR('❌ No hay usuarios disponibles para prueba')
                )
                return
        else:
            try:
                usuario = User.objects.get(id=usuario_id)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'❌ Usuario con ID {usuario_id} no encontrado')
                )
                return
        
        self.stdout.write(f'📍 Lote seleccionado: {lote.nombre} ({lote.latitud}, {lote.longitud})')
        self.stdout.write(f'👤 Usuario: {usuario.email}\n')
        
        # Probar entrenamiento de modelo
        self.stdout.write('🧠 Entrenando modelo Random Forest...')
        resultado_entrenamiento = servicio_ml.entrenar_modelo_para_lote(
            lote=lote,
            metodo='random_forest',
            dias_datos=60  # Usar menos días para prueba rápida
        )
        
        if resultado_entrenamiento['exito']:
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Modelo entrenado exitosamente\n'
                    f'   - R² Score: {resultado_entrenamiento["r2_score"]:.4f}\n'
                    f'   - MAE Score: {resultado_entrenamiento["mae_score"]:.2f}\n'
                    f'   - Datos entrenamiento: {resultado_entrenamiento["datos_entrenamiento"]}'
                )
            )
        else:
            self.stdout.write(
                self.style.ERROR(
                    f'❌ Error entrenando modelo: {resultado_entrenamiento["error"]}'
                )
            )
            return
        
        # Probar predicción
        self.stdout.write('\n🔮 Generando predicción para 3 días...')
        resultado_prediccion = servicio_ml.generar_prediccion(
            lote=lote,
            usuario=usuario,
            tipo_prediccion='3_dias',
            metodo='random_forest'
        )
        
        if resultado_prediccion['exito']:
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Predicción generada exitosamente\n'
                    f'   - ID Predicción: {resultado_prediccion["prediccion_id"]}\n'
                    f'   - Predicciones: {resultado_prediccion["predicciones"]}\n'
                    f'   - Confianza: {resultado_prediccion["confianza"]}%\n'
                    f'   - Nivel de riesgo: {resultado_prediccion["nivel_riesgo"]}\n'
                    f'   - Alerta generada: {"Sí" if resultado_prediccion["alerta_generada"] else "No"}'
                )
            )
        else:
            self.stdout.write(
                self.style.ERROR(
                    f'❌ Error generando predicción: {resultado_prediccion["error"]}'
                )
            )
            return
        
        # Verificar precisión del modelo
        self.stdout.write('\n📊 Verificando precisión del modelo...')
        resultado_precision = servicio_ml.verificar_precision_modelo(
            lote=lote,
            metodo='random_forest'
        )
        
        if resultado_precision['exito']:
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Verificación de precisión completada\n'
                    f'   - Error promedio: {resultado_precision["error_promedio"]}%\n'
                    f'   - Predicciones verificadas: {resultado_precision["predicciones_verificadas"]}\n'
                    f'   - Necesita reentrenamiento: {"Sí" if resultado_precision["necesita_reentrenamiento"] else "No"}'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f'⚠️ No se pudo verificar precisión: {resultado_precision["error"]}'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS('\n🎉 ¡Prueba del sistema de predicciones completada exitosamente!')
        )