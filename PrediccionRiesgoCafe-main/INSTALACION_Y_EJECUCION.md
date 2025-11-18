# 📘 Guía de Instalación y Ejecución del Sistema de Predicción de Radiación Solar para Cultivos de Café

## 📋 Tabla de Contenidos
1. [Requisitos Previos](#requisitos-previos)
2. [Instalación del Backend (Django)](#instalación-del-backend-django)
3. [Instalación del Frontend (React)](#instalación-del-frontend-react)
4. [Configuración de la Base de Datos](#configuración-de-la-base-de-datos)
5. [Carga de Datos Históricos](#carga-de-datos-históricos)
6. [Ejecución del Proyecto](#ejecución-del-proyecto)
7. [Primer Uso](#primer-uso)
8. [Solución de Problemas Comunes](#solución-de-problemas-comunes)

---

## 🔧 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

### Software Requerido
- **Python 3.11+** - [Descargar](https://www.python.org/downloads/)
- **Node.js 18+** y **npm** - [Descargar](https://nodejs.org/)
- **PostgreSQL 14+** - [Descargar](https://www.postgresql.org/download/)
- **Git** - [Descargar](https://git-scm.com/downloads)

### Verificar Instalaciones
```powershell
# Verificar Python
python --version

# Verificar Node.js y npm
node --version
npm --version

# Verificar PostgreSQL
psql --version

# Verificar Git
git --version
```

---

## 🐍 Instalación del Backend (Django)

### Paso 1: Clonar el Repositorio
```powershell
# Navegar a la carpeta deseada
cd C:\Users\TuUsuario\ProyectoPractica

# Clonar el repositorio
git clone https://github.com/dibarguenm-ui/Cultivo_caf.git
cd Cultivo_caf\PrediccionRiesgoCafe-main
```

### Paso 2: Crear Entorno Virtual de Python
```powershell
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En PowerShell:
.\venv\Scripts\Activate.ps1

# En CMD:
venv\Scripts\activate.bat

# En Git Bash:
source venv/Scripts/activate
```

### Paso 3: Instalar Dependencias de Python
```powershell
# Navegar a la carpeta backend
cd backend

# Instalar todas las dependencias
pip install -r requirements.txt
```

**Dependencias principales instaladas:**
- Django 5.2.6
- Django REST Framework
- PostgreSQL adapter (psycopg2)
- scikit-learn (Machine Learning)
- pandas, numpy (Análisis de datos)
- requests (API de NASA POWER)

### Paso 4: Configurar Variables de Entorno

Edita el archivo `backend/backend/settings.py` y configura:

```python
# Configuración de Base de Datos
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'cultivoscafe',
        'USER': 'postgres',
        'PASSWORD': 'TU_CONTRASEÑA_POSTGRES',  # ⚠️ Cambiar aquí
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

```

---

## ⚛️ Instalación del Frontend (React)

### Paso 1: Instalar Dependencias de Node.js
```powershell
# Desde la raíz del proyecto
cd ..\frontend

# Instalar dependencias
npm install
```

**Dependencias principales instaladas:**
- React 18.3.1
- React Router DOM
- Axios (peticiones HTTP)
- Recharts (gráficos)
- Leaflet (mapas)

### Paso 2: Configurar URL del Backend

Verifica que en `frontend/src/config/api.js` esté configurado:

```javascript
const API_URL = 'http://localhost:8000/api';
```

---

## 🗄️ Configuración de la Base de Datos

### Paso 1: Iniciar Servicio de PostgreSQL

**En Windows (PowerShell como Administrador):**
```powershell
# Verificar estado del servicio
Get-Service -Name postgresql*

# Si no está corriendo, iniciarlo
Start-Service -Name postgresql-x64-*
```

**En Linux/Mac:**
```bash
sudo systemctl start postgresql
# o
brew services start postgresql
```

### Paso 2: Crear Base de Datos

```powershell
# Conectar a PostgreSQL
psql -U postgres

# Dentro de psql:
CREATE DATABASE cultivoscafe;
\q
```

### Paso 3: Ejecutar Migraciones

```powershell
# Desde la carpeta backend
cd ..\backend

# Crear archivos de migración
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate
```

**Salida esperada:**
```
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying users.0001_initial... OK
  Applying cultivos.0001_initial... OK
  Applying clima.0001_initial... OK
  Applying predicciones.0001_initial... OK
  ...
```

### Paso 4: Crear Superusuario

```powershell
python manage.py createsuperuser
```

**Ingresa los datos solicitados:**
- Username: `admin`
- Email: `tu_email@example.com`
- Password: (tu contraseña segura)

### Paso 5: Cargar Datos Iniciales (Umbrales de Radiación)

```powershell
python manage.py load_umbrales
```

---

## 📊 Carga de Datos Históricos

Para que el sistema de Machine Learning funcione, necesitas datos climáticos históricos.

### Opción 1: Datos Reales de NASA POWER (Recomendado)

```powershell
# Ejecutar script de carga
python cargar_datos_historicos_simple.py
```

**Proceso:**
1. El script busca todos los lotes registrados
2. Descarga 90 días de datos desde NASA POWER API
3. Guarda los datos en la base de datos
4. Muestra resumen de registros creados

**Requisitos:**
- Al menos 1 lote registrado con coordenadas válidas
- Conexión a Internet activa

### Opción 2: Datos Sintéticos (Para Pruebas)

```powershell
python manage.py generar_datos_sinteticos --dias 90
```

**Uso:**
- Genera datos realistas simulados
- Útil para desarrollo y pruebas
- No requiere conexión a Internet

### Verificar Datos Cargados

```powershell
# Ejecutar diagnóstico
python diagnostico_irradiancia.py
```

**Salida esperada:**
```
📊 Total de registros: 90+
✅ Suficientes datos para entrenar modelo ML
```

---

## 🚀 Ejecución del Proyecto

### Terminal 1: Iniciar Backend (Django)

```powershell
# Activar entorno virtual
.\venv\Scripts\Activate.ps1

# Navegar a backend
cd backend

# Iniciar servidor de desarrollo
python manage.py runserver
```

**Salida esperada:**
```
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

**URLs disponibles:**
- Admin Panel: http://localhost:8000/admin
- API Root: http://localhost:8000/api/
- API Docs: http://localhost:8000/api/docs/ (si está configurado)

### Terminal 2: Iniciar Frontend (React)

```powershell
# Navegar a frontend
cd frontend

# Iniciar servidor de desarrollo
npm start
```

**Salida esperada:**
```
Compiled successfully!

You can now view the app in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

**La aplicación se abrirá automáticamente en tu navegador.**

---

## 👥 Primer Uso

### 1. Registrar Usuario

1. Abre http://localhost:3000
2. Haz clic en **"Registrarse"**
3. Completa el formulario:
   - Username
   - Email
   - Contraseña
   - Nombre y Apellido
4. Verifica tu email (si está configurado) o activa manualmente desde admin

### 2. Crear Primer Lote

1. Inicia sesión
2. Ve a **"Mis Lotes"** → **"Crear Nuevo Lote"**
3. Completa la información:
   - **Nombre del lote**: Ej. "Lote 1 - Finca La Esperanza"
   - **Variedad de café**: Selecciona (Caturra, Bourbon, Típica, etc.)
   - **Ubicación**: 
     - **Opción A**: Permite geolocalización automática
     - **Opción B**: Ingresa coordenadas manualmente
   - **Área**: En hectáreas
   - **Altitud**: En metros sobre el nivel del mar
4. Haz clic en **"Guardar"**

### 3. Actualizar Datos Climáticos

1. En la vista de tu lote, haz clic en **"Actualizar Datos Climáticos"**
2. El sistema obtiene datos de NASA POWER automáticamente
3. Verás temperatura, humedad, radiación solar actual

### 4. Generar Primera Predicción

1. Ve a **"Predicciones"** → **"Nueva Predicción"**
2. Selecciona:
   - **Lote**: Tu lote registrado
   - **Horizonte de Predicción**: 3, 5 o 7 días
   - **Método ML**: Random Forest (recomendado) o Regresión Lineal
3. Haz clic en **"Generar Predicción"**

**¿Qué sucede?**
- El sistema entrena el modelo ML con datos históricos
- Genera predicciones de radiación solar
- Evalúa nivel de riesgo (Bajo, Medio, Alto, Crítico)
- **Envía email automático** con los resultados
- Muestra gráfico de predicciones

### 5. Verificar Email de Alerta

Revisa tu email (el configurado en el perfil). Deberías recibir:

**Asunto:** 🌤️ Nueva Predicción Climática - [Nombre del Lote]

**Contenido:**
- Resumen de la predicción
- Radiación promedio predicha
- Predicciones día por día
- Nivel de riesgo
- Recomendaciones

---

## 🔍 Verificación del Sistema

### Probar API Backend

```powershell
# En PowerShell
Invoke-WebRequest -Uri http://localhost:8000/api/ -Method GET

# Con curl
curl http://localhost:8000/api/
```

### Probar Notificaciones

```powershell
# Desde backend/
python test_notificaciones.py
```

**Salida esperada:**
```
✅ Email enviado: True
📧 Revisa el correo: tu_email@example.com
```

### Verificar Datos

```powershell
# Ver últimas mediciones
python diagnostico_irradiancia.py

# Limpiar datos anómalos
python limpiar_datos_anomalos.py
```

---

## 🐛 Solución de Problemas Comunes

### Error: "No module named 'django'"
**Solución:**
```powershell
# Asegúrate de que el entorno virtual esté activado
.\venv\Scripts\Activate.ps1

# Reinstala dependencias
pip install -r requirements.txt
```

### Error: "Port 8000 is already in use"
**Solución:**
```powershell
# Usar otro puerto
python manage.py runserver 8001

# O matar el proceso en el puerto 8000
# En PowerShell como Admin:
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process
```

### Error: "PostgreSQL connection refused"
**Solución:**
```powershell
# Verificar que PostgreSQL esté corriendo
Get-Service postgresql*

# Iniciar servicio si está detenido
Start-Service postgresql-x64-*

# Verificar credenciales en settings.py
```

### Error: "scale < 0" al generar predicción
**Solución:**
```powershell
# Limpiar datos anómalos
python limpiar_datos_anomalos.py

# Responde 's' para corregir presiones extremas
```

### Error: "No hay datos históricos suficientes"
**Solución:**
```powershell
# Cargar datos históricos
python cargar_datos_historicos_simple.py

# Necesitas al menos 30 registros por lote
```

### Frontend no se conecta al Backend
**Solución:**
1. Verifica que Django esté corriendo en http://localhost:8000
2. Revisa CORS en `settings.py`:
```python
CORS_ALLOW_ALL_ORIGINS = True  # Para desarrollo
```
3. Verifica configuración en `frontend/src/config/api.js`

### Email no se envía
**Solución:**
1. Verifica configuración SMTP en `settings.py`
2. Para Gmail, usa **App Password** (no la contraseña normal)
3. Activa "Aplicaciones menos seguras" o usa OAuth2
4. Prueba con: `python test_notificaciones.py`

---

## 📁 Estructura del Proyecto

```
PrediccionRiesgoCafe-main/
├── backend/                          # Django Backend
│   ├── manage.py                     # Script principal Django
│   ├── requirements.txt              # Dependencias Python
│   ├── backend/                      # Configuración del proyecto
│   │   ├── settings.py              # Configuración global
│   │   ├── urls.py                  # URLs principales
│   │   └── wsgi.py                  # Deployment
│   ├── users/                       # App de usuarios
│   ├── cultivos/                    # App de lotes de café
│   ├── clima/                       # App de datos climáticos
│   ├── predicciones/                # App de predicciones ML
│   ├── cargar_datos_historicos_simple.py  # Script carga datos
│   ├── test_notificaciones.py       # Test de emails
│   └── diagnostico_irradiancia.py   # Diagnóstico de datos
├── frontend/                        # React Frontend
│   ├── package.json                 # Dependencias Node.js
│   ├── public/                      # Archivos públicos
│   └── src/                         # Código fuente React
│       ├── App.js                   # Componente principal
│       ├── modules/                 # Módulos por funcionalidad
│       │   ├── users/              # Autenticación
│       │   ├── cultivos/           # Gestión de lotes
│       │   ├── clima/              # Datos climáticos
│       │   └── predicciones/       # Predicciones ML
│       └── config/                  # Configuración
└── docs/                            # Documentación
    ├── DOCUMENTACION_TECNICA_PROYECTO.md
    └── PLAN_PRUEBAS_FUNCIONALES.md
```

---

## 🎯 Comandos Útiles de Administración

### Django Management Commands

```powershell
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Abrir shell de Django
python manage.py shell

# Limpiar base de datos
python manage.py flush

# Recolectar archivos estáticos
python manage.py collectstatic

# Generar datos sintéticos
python manage.py generar_datos_sinteticos --dias 90

# Cargar umbrales de radiación
python manage.py load_umbrales

# Probar conexión NASA POWER
python manage.py test_nasa_power

# Ver diagnósticos
python manage.py diagnostic
```

### NPM Scripts (Frontend)

```powershell
# Iniciar desarrollo
npm start

# Crear build de producción
npm run build

# Ejecutar tests
npm test

# Limpiar node_modules
rm -r node_modules
npm install
```

---

## 🔐 Seguridad para Producción

**⚠️ IMPORTANTE: Antes de desplegar en producción:**

1. **Cambiar SECRET_KEY en settings.py:**
```python
SECRET_KEY = 'GENERA_UNA_CLAVE_SEGURA_AQUI'
```

2. **Desactivar DEBUG:**
```python
DEBUG = False
```

3. **Configurar ALLOWED_HOSTS:**
```python
ALLOWED_HOSTS = ['tudominio.com', 'www.tudominio.com']
```

4. **Configurar CORS correctamente:**
```python
CORS_ALLOWED_ORIGINS = [
    "https://tudominio.com",
]
```

5. **Usar variables de entorno para secretos:**
```python
import os
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_PASSWORD')
```

---

## 📞 Soporte y Contacto

- **Repositorio**: https://github.com/dibarguenm-ui/Cultivo_caf
- **Documentación Técnica**: Ver `docs/DOCUMENTACION_TECNICA_PROYECTO.md`
- **Plan de Pruebas**: Ver `docs/PLAN_PRUEBAS_FUNCIONALES.md`

---

## 📝 Licencia

Este proyecto fue desarrollado como parte de un trabajo académico de la Universidad Central de Colombia.

---

## ✅ Checklist de Instalación Exitosa

- [ ] Python 3.11+ instalado
- [ ] Node.js 18+ y npm instalados
- [ ] PostgreSQL 14+ instalado y corriendo
- [ ] Repositorio clonado
- [ ] Entorno virtual creado y activado
- [ ] Dependencias Python instaladas
- [ ] Dependencias Node.js instaladas
- [ ] Base de datos creada
- [ ] Migraciones ejecutadas
- [ ] Superusuario creado
- [ ] Datos históricos cargados (≥30 registros por lote)
- [ ] Backend corriendo en http://localhost:8000
- [ ] Frontend corriendo en http://localhost:3000
- [ ] Primer lote creado
- [ ] Primera predicción generada exitosamente
- [ ] Email de alerta recibido

**¡Felicitaciones! 🎉 Tu sistema está completamente funcional.**

---

**Última actualización:** Noviembre 2025
**Versión:** 1.0.0
