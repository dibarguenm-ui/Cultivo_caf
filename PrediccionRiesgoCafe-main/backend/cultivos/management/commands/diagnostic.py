from django.core.management.base import BaseCommand
from django.db import connection
from cultivos.models import UmbralRadiacionSolar, LoteCafe
from django.db.models import DecimalField


class Command(BaseCommand):
    help = 'Diagnóstico completo del sistema de umbrales de radiación'

    def handle(self, *args, **options):
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("🔍 DIAGNÓSTICO DEL SISTEMA"))
        self.stdout.write("=" * 60)

        # 1. Verificar tablas en BD
        self.stdout.write("\n📊 Tablas en base de datos:")
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND (name LIKE 'cultivos%' OR name LIKE 'lotes%')
                ORDER BY name
            """)
            tables = cursor.fetchall()
            if tables:
                for table in tables:
                    self.stdout.write(f"  ✓ {table[0]}")
            else:
                self.stdout.write(self.style.WARNING("  ⚠️  NO SE ENCONTRARON TABLAS"))

        # 2. Verificar umbrales cargados
        self.stdout.write("\n📈 Umbrales de Radiación Cargados:")
        try:
            umbrales = UmbralRadiacionSolar.objects.all()
            self.stdout.write(f"  Total de umbrales: {umbrales.count()}")
            
            if umbrales.count() > 0:
                for umbral in umbrales:
                    self.stdout.write(
                        f"    • {umbral.variedad}: {umbral.radiacion_minima} → "
                        f"{umbral.radiacion_optima} → {umbral.radiacion_maxima} W/m²"
                    )
                self.stdout.write(self.style.SUCCESS("  ✅ Umbrales cargados correctamente"))
            else:
                self.stdout.write(self.style.ERROR("  ❌ NO HAY UMBRALES CARGADOS EN LA BD"))
                self.stdout.write("     Ejecuta: python manage.py load_umbrales")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  ❌ Error: {e}"))

        # 3. Verificar lotes
        self.stdout.write("\n🌾 Lotes en Base de Datos:")
        try:
            lotes = LoteCafe.objects.all()
            self.stdout.write(f"  Total de lotes: {lotes.count()}")
            if lotes.count() > 0:
                for lote in lotes:
                    self.stdout.write(f"    • {lote.nombre} ({lote.departamento})")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  ❌ Error: {e}"))

        # 4. Verificar campos en LoteCafe
        self.stdout.write("\n🔧 Campos en modelo LoteCafe:")
        try:
            important_fields = ['latitud', 'longitud', 'altitud']
            for field in LoteCafe._meta.fields:
                if field.name in important_fields:
                    null_blank = "✓" if field.null and field.blank else "✗"
                    self.stdout.write(
                        f"  • {field.name}: null={field.null}, blank={field.blank} [{null_blank}]"
                    )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  ❌ Error: {e}"))

        # 5. Verificar campos DecimalField en UmbralRadiacionSolar
        self.stdout.write("\n🔧 Campos DecimalField en UmbralRadiacionSolar:")
        try:
            for field in UmbralRadiacionSolar._meta.fields:
                if isinstance(field, DecimalField):
                    max_int_digits = field.max_digits - field.decimal_places
                    self.stdout.write(
                        f"  • {field.name}: max_digits={field.max_digits}, "
                        f"decimal_places={field.decimal_places} "
                        f"(Max int digits: {max_int_digits})"
                    )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  ❌ Error: {e}"))

        # 6. Verificar estado de migraciones
        self.stdout.write("\n📋 Estado de Migraciones:")
        try:
            from django.core.management import call_command
            from io import StringIO
            
            out = StringIO()
            call_command('showmigrations', 'cultivos', stdout=out)
            migrations_output = out.getvalue()
            
            if '[X]' in migrations_output:
                self.stdout.write(self.style.SUCCESS("  ✅ Migraciones aplicadas"))
                for line in migrations_output.split('\n'):
                    if '[X]' in line:
                        self.stdout.write(f"    {line.strip()}")
            else:
                self.stdout.write(self.style.WARNING("  ⚠️  Migraciones pendientes"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  ❌ Error: {e}"))

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("✅ DIAGNÓSTICO COMPLETADO"))
        self.stdout.write("=" * 60 + "\n")
