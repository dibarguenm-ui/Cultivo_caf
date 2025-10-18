from django.core.management.base import BaseCommand
from django.db import connection
from clima.models import DatosClimaticos

class Command(BaseCommand):
    help = 'Borra todos los registros de mediciones climáticas de la base de datos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirmar la eliminación sin pedir confirmación',
        )

    def handle(self, *args, **options):
        print("\n" + "="*80)
        print("ADVERTENCIA: Esta acción borrará TODOS los registros de mediciones")
        print("="*80 + "\n")

        # Contar registros antes
        count_before = DatosClimaticos.objects.count()
        print(f"📊 Registros actuales: {count_before}")

        if not options['confirm']:
            confirmacion = input("\n⚠️  ¿Estás seguro de que deseas borrar TODOS los registros? (sí/no): ")
            if confirmacion.lower() not in ['sí', 'si', 'yes', 'y']:
                self.stdout.write(self.style.WARNING('Operación cancelada.'))
                return

        try:
            # Borrar todos los registros
            DatosClimaticos.objects.all().delete()

            # Resetear el autoincrement (secuencia en BD)
            with connection.cursor() as cursor:
                if 'sqlite' in connection.settings_dict['ENGINE']:
                    cursor.execute("DELETE FROM sqlite_sequence WHERE name='clima_datos_climaticos';")
                    print("📝 SQLite: Secuencia reseteada")
                elif 'postgresql' in connection.settings_dict['ENGINE']:
                    cursor.execute("ALTER SEQUENCE clima_datos_climaticos_id_seq RESTART WITH 1;")
                    print("📝 PostgreSQL: Secuencia reseteada")
                elif 'mysql' in connection.settings_dict['ENGINE']:
                    cursor.execute("ALTER TABLE clima_datos_climaticos AUTO_INCREMENT = 1;")
                    print("📝 MySQL: Secuencia reseteada")

            count_after = DatosClimaticos.objects.count()
            print(f"\n✅ Eliminación completada exitosamente")
            print(f"📊 Registros antes: {count_before}")
            print(f"📊 Registros después: {count_after}")
            print(f"✂️  Eliminados: {count_before - count_after}")
            print("\n" + "="*80)
            print("✅ BASE DE DATOS LIMPIA - Listo para nuevas mediciones")
            print("="*80 + "\n")

            self.stdout.write(self.style.SUCCESS('✅ Operación completada.'))

        except Exception as e:
            print(f"\n❌ Error durante la eliminación: {str(e)}")
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
