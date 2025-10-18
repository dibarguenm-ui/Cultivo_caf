# Generated migration for removing required constraints from optional fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cultivos', '0004_merge_20251015_2319'),
    ]

    operations = [
        migrations.AlterField(
            model_name='lotecafe',
            name='municipio',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='lotecafe',
            name='arboles_hectarea',
            field=models.PositiveIntegerField(blank=True, default=5000, null=True),
        ),
        migrations.AlterField(
            model_name='lotecafe',
            name='edad_plantacion',
            field=models.PositiveIntegerField(blank=True, default=2, null=True),
        ),
    ]
