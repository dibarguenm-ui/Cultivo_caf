"""
Script de prueba para el sistema de alertas automáticas
Ejecutar: python manage.py shell < test_notificaciones.py
"""

print("\n" + "="*70)
print("🧪 TEST - SISTEMA DE ALERTAS AUTOMÁTICAS")
print("="*70 + "\n")

# 1. Importar módulos necesarios
print("📦 Importando módulos...")
from predicciones.notifications import servicio_notificaciones
from predicciones.models import PrediccionRadiacion
from users.models import CustomUser
from cultivos.models import LoteCafe

# 2. Verificar que existan datos de prueba
print("\n📊 Verificando datos existentes...")

usuarios = CustomUser.objects.all()
print(f"   ✓ Usuarios en sistema: {usuarios.count()}")

lotes = LoteCafe.objects.all()
print(f"   ✓ Lotes en sistema: {lotes.count()}")

predicciones = PrediccionRadiacion.objects.all()
print(f"   ✓ Predicciones en sistema: {predicciones.count()}")

if predicciones.count() == 0:
    print("\n⚠️  No hay predicciones en el sistema.")
    print("   Genera una predicción primero usando el endpoint:")
    print("   POST /api/predicciones/predicciones/generar_prediccion/")
    print("\n   Body ejemplo:")
    print("   {")
    print('     "lote_id": 1,')
    print('     "tipo_prediccion": "3_dias",')
    print('     "metodo_prediccion": "random_forest"')
    print("   }")
    exit()

# 3. Obtener última predicción
print("\n🔍 Obteniendo última predicción...")
prediccion = PrediccionRadiacion.objects.last()
print(f"   ID: {prediccion.id}")
print(f"   Lote: {prediccion.lote.nombre}")
print(f"   Usuario: {prediccion.usuario.username}")
print(f"   Nivel de Riesgo: {prediccion.nivel_riesgo_predicho}")
print(f"   Fecha: {prediccion.fecha_generacion}")

# 4. Probar envío de notificación
print("\n📧 Enviando notificación de prueba...")
print(f"   Email destino: {prediccion.usuario.email}")

resultado = servicio_notificaciones.enviar_alerta_prediccion(
    prediccion,
    prediccion.usuario,
    prediccion.lote
)

# 5. Mostrar resultados
print("\n📊 RESULTADOS DEL ENVÍO:")
print("="*70)
print(f"   ✅ Email enviado: {resultado['email_enviado']}")
print(f"   📱 SMS enviado: {resultado['sms_enviado']}")

if resultado['errores']:
    print(f"\n   ❌ Errores encontrados:")
    for error in resultado['errores']:
        print(f"      - {error}")
else:
    print(f"\n   ✓ Sin errores")

# 6. Verificar email en consola (desarrollo)
if resultado['email_enviado']:
    print("\n✉️  EMAIL ENVIADO EXITOSAMENTE")
    print("   Si estás en modo desarrollo, revisa la consola de Django")
    print("   para ver el contenido del email simulado.")
    print("\n   En producción, el email llegará a:")
    print(f"   📧 {prediccion.usuario.email}")

# 7. Información adicional
print("\n" + "="*70)
print("📝 INFORMACIÓN ADICIONAL")
print("="*70)
print(f"\nContenido del email incluye:")
print(f"  • Radiación promedio: {prediccion.get_prediccion_promedio()} W/m²")
print(f"  • Días predichos: {prediccion.get_dias_predichos()}")
print(f"  • Confianza: {prediccion.confianza_prediccion}%")
print(f"  • Alerta generada: {'Sí' if prediccion.alerta_generada else 'No'}")

print("\n✅ TEST COMPLETADO\n")

