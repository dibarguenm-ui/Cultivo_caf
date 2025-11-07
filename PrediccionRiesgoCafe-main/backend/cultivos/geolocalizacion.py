"""
Servicio de geolocalización para determinar el departamento de Colombia
basado en coordenadas GPS.
"""

def obtener_departamento_por_coordenadas(latitud, longitud):
    """
    Determina el departamento de Colombia basado en coordenadas GPS.
    
    Args:
        latitud (float): Latitud en grados decimales
        longitud (float): Longitud en grados decimales
    
    Returns:
        str: Nombre del departamento o 'Otro' si no se puede determinar
    """
    
    # Convertir a float si viene como Decimal
    lat = float(latitud)
    lon = float(longitud)
    
    # Rangos aproximados de departamentos cafeteros principales de Colombia
    # Estas son aproximaciones basadas en límites geográficos conocidos
    
    departamentos_coordenadas = {
        'Antioquia': {
            'lat_min': 5.4, 'lat_max': 8.9,
            'lon_min': -77.1, 'lon_max': -73.8
        },
        'Caldas': {
            'lat_min': 4.8, 'lat_max': 5.8,
            'lon_min': -75.8, 'lon_max': -74.7
        },
        'Risaralda': {
            'lat_min': 4.7, 'lat_max': 5.3,
            'lon_min': -76.3, 'lon_max': -75.4
        },
        'Quindío': {
            'lat_min': 4.2, 'lat_max': 4.8,
            'lon_min': -75.9, 'lon_max': -75.4
        },
        'Valle del Cauca': {
            'lat_min': 3.1, 'lat_max': 5.1,
            'lon_min': -77.2, 'lon_max': -75.7
        },
        'Cundinamarca': {
            'lat_min': 3.7, 'lat_max': 5.8,
            'lon_min': -74.9, 'lon_max': -73.0
        },
        'Huila': {
            'lat_min': 1.4, 'lat_max': 3.4,
            'lon_min': -76.6, 'lon_max': -74.4
        },
        'Tolima': {
            'lat_min': 3.1, 'lat_max': 5.6,
            'lon_min': -76.1, 'lon_max': -74.4
        },
        'Cauca': {
            'lat_min': 1.6, 'lat_max': 3.2,
            'lon_min': -77.8, 'lon_max': -75.6
        },
        'Nariño': {
            'lat_min': 0.5, 'lat_max': 2.8,
            'lon_min': -79.0, 'lon_max': -76.2
        },
        'Santander': {
            'lat_min': 5.8, 'lat_max': 8.7,
            'lon_min': -74.4, 'lon_max': -72.1
        },
        'Boyacá': {
            'lat_min': 4.5, 'lat_max': 7.3,
            'lon_min': -74.0, 'lon_max': -71.6
        }
    }
    
    # Buscar el departamento que contenga las coordenadas
    for departamento, coordenadas in departamentos_coordenadas.items():
        if (coordenadas['lat_min'] <= lat <= coordenadas['lat_max'] and
            coordenadas['lon_min'] <= lon <= coordenadas['lon_max']):
            return departamento
    
    # Si no se encuentra en ningún departamento conocido, devolver 'Otro'
    return 'Otro'


def es_coordenada_colombia(latitud, longitud):
    """
    Verifica si las coordenadas están dentro del territorio de Colombia.
    
    Args:
        latitud (float): Latitud en grados decimales
        longitud (float): Longitud en grados decimales
    
    Returns:
        bool: True si está en Colombia, False si no
    """
    
    lat = float(latitud)
    lon = float(longitud)
    
    # Límites aproximados de Colombia
    # Latitud: -4.2° a 15.5°
    # Longitud: -81.8° a -66.9°
    
    return (-4.2 <= lat <= 15.5) and (-81.8 <= lon <= -66.9)


def obtener_region_cafetera(departamento):
    """
    Determina si el departamento pertenece a una región cafetera específica.
    
    Args:
        departamento (str): Nombre del departamento
    
    Returns:
        str: Región cafetera ('Eje Cafetero', 'Centro', 'Sur', 'Norte', 'Otro')
    """
    
    regiones_cafeteras = {
        'Eje Cafetero': ['Caldas', 'Risaralda', 'Quindío'],
        'Centro': ['Antioquia', 'Cundinamarca', 'Boyacá'],
        'Sur': ['Huila', 'Cauca', 'Nariño'],
        'Norte': ['Santander'],
        'Occidente': ['Valle del Cauca', 'Tolima']
    }
    
    for region, departamentos in regiones_cafeteras.items():
        if departamento in departamentos:
            return region
    
    return 'Otro'