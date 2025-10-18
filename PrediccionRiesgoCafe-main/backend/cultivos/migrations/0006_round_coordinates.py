# Generated migration for rounding coordinates to 3 decimal places

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cultivos', '0005_optional_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lotecafe',
            name='latitud',
            field=models.DecimalField(blank=True, decimal_places=3, max_digits=9, null=True),
        ),
        migrations.AlterField(
            model_name='lotecafe',
            name='longitud',
            field=models.DecimalField(blank=True, decimal_places=3, max_digits=9, null=True),
        ),
    ]
