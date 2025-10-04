from django.contrib import admin
from .models import LoteCafe

@admin.register(LoteCafe)
class LoteCafeAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'usuario', 'municipio', 'departamento', 'variedad', 'hectareas')
    list_filter = ('departamento', 'variedad', 'nivel_sombra')
    search_fields = ('nombre', 'municipio', 'usuario__username')

