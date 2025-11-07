"""
Comando para generar datos climáticos sintéticos para pruebas del sistema ML
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
import random
from clima.models import DatosClimaticos
from cultivos.models import LoteCafe


class Command(BaseCommand):
    help = 'Genera datos climáticos sintéticos para pruebas de ML'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--lote-id',
            type=int,
            help='ID del lote para generar datos'
        )
        parser.add_argument(
            '--dias',
            type=int,
            default=60,
            help='Número de días de datos históricos a generar'
        )
    
    def handle(self, *args, **options):
        lote_id = options.get('lote_id')
        dias = options.get('dias', 60)
        
        if lote_id:
            try:
                lote = LoteCafe.objects.get(id=lote_id)
                lotes = [lote]
            except LoteCafe.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'❌ Lote con ID {lote_id} no encontrado')
                )
                return
        else:
            lotes = LoteCafe.objects.all()
        
        if not lotes:
            self.stdout.write(
                self.style.ERROR('❌ No hay lotes disponibles')
            )
            return
        
        self.stdout.write(f'🔧 Generando {dias} días de datos sintéticos...')
        
        total_registros = 0
        fecha_fin = timezone.now().date()
        fecha_inicio = fecha_fin - timedelta(days=dias)
        
        for lote in lotes:
            self.stdout.write(f'📍 Procesando lote: {lote.nombre}')
            
            # Limpiar datos existentes para evitar duplicados
            DatosClimaticos.objects.filter(
                lote=lote,
                fecha_medicion__date__range=[fecha_inicio, fecha_fin]
            ).delete()
            
            registros_lote = 0
            fecha_actual = fecha_inicio
            
            while fecha_actual <= fecha_fin:
                # Generar datos sintéticos realistas para Colombia
                temperatura_base = 18 + random.uniform(-3, 5)  # 15-23°C
                temperatura = round(temperatura_base + random.uniform(-2, 2), 1)
                
                humedad = round(random.uniform(70, 95), 1)  # Alta humedad tropical
                
                # Irradiancia solar variable (mayor durante el día, cero en la noche)
                hora = random.randint(6, 18)  # Horas de luz solar
                if 6 <= hora <= 18:
                    irradiancia_base = 400 + random.uniform(-100, 300)  # W/m²
                    # Reducir por nubosidad
                    factor_nubosidad = random.uniform(0.3, 1.0)
                    irradiancia = round(irradiancia_base * factor_nubosidad, 2)
                else:
                    irradiancia = 0
                
                presion = round(81 + random.uniform(-2, 2), 2)  # kPa
                velocidad_viento = round(random.uniform(0.1, 3.0), 1)  # m/s
                nubosidad = round(random.uniform(20, 80), 1)  # %
                
                # Precipitación (más común en Colombia)
                if random.random() < 0.4:  # 40% de probabilidad de lluvia
                    precipitacion = round(random.uniform(0.5, 25), 1)
                else:
                    precipitacion = 0
                
                # Crear fecha y hora aleatoria
                fecha_medicion = datetime.combine(
                    fecha_actual,
                    datetime.min.time().replace(
                        hour=hora,
                        minute=random.randint(0, 59)
                    )
                )
                fecha_medicion = timezone.make_aware(fecha_medicion)
                
                # Crear registro
                DatosClimaticos.objects.create(
                    lote=lote,
                    fecha_medicion=fecha_medicion,
                    irradiancia_solar=irradiancia,
                    temperatura=temperatura,
                    humedad_relativa=humedad,
                    nubosidad=nubosidad,
                    precipitacion=precipitacion,
                    presion_atmosferica=presion,
                    velocidad_viento=velocidad_viento,
                    fuente_datos='SINTETICO',
                    calidad_datos='BUENA',
                    descripcion_clima='Datos generados sintéticamente para pruebas ML'
                )
                
                registros_lote += 1
                fecha_actual += timedelta(days=1)
            
            total_registros += registros_lote
            self.stdout.write(f'  ✅ {registros_lote} registros creados')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'🎉 ¡Datos sintéticos generados exitosamente!\n'
                f'   - Total registros: {total_registros}\n'
                f'   - Lotes procesados: {len(lotes)}\n'
                f'   - Período: {fecha_inicio} a {fecha_fin}'
            )
        )