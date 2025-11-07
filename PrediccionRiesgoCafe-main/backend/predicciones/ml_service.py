"""
Servicio de Machine Learning para predicción de radiación solar
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from django.utils import timezone
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler
import joblib
import os
from typing import List, Dict, Tuple, Optional

from clima.models import DatosClimaticos
from cultivos.models import LoteCafe, UmbralRadiacionSolar
from .models import PrediccionRadiacion, ConfiguracionPrediccion


class ServicioPrediccionML:
    """
    Servicio principal para predicciones de radiación solar usando ML
    """
    
    def __init__(self):
        self.modelos_entrenados = {}
        self.scalers = {}
        self.directorio_modelos = 'predicciones/modelos/'
        self._crear_directorio_modelos()
    
    def _crear_directorio_modelos(self):
        """Crea el directorio para almacenar modelos si no existe"""
        if not os.path.exists(self.directorio_modelos):
            os.makedirs(self.directorio_modelos)
    
    def obtener_datos_historicos(self, lote: LoteCafe, dias: int = 90) -> pd.DataFrame:
        """
        Obtiene datos históricos de clima para un lote específico
        """
        fecha_fin = timezone.now().date()
        fecha_inicio = fecha_fin - timedelta(days=dias)
        
        datos = DatosClimaticos.objects.filter(
            lote=lote,
            fecha_medicion__date__range=[fecha_inicio, fecha_fin]
        ).order_by('fecha_medicion')
        
        if not datos.exists():
            raise ValueError(f"No hay datos históricos suficientes para el lote {lote.nombre}")
        
        # Convertir a DataFrame
        df = pd.DataFrame([{
            'fecha': d.fecha_medicion.date(),
            'radiacion_solar': float(d.irradiancia_solar),
            'temperatura': float(d.temperatura),
            'humedad': float(d.humedad_relativa),
            'presion': float(d.presion_atmosferica) if d.presion_atmosferica else 0,
            'velocidad_viento': float(d.velocidad_viento) if d.velocidad_viento else 0
        } for d in datos])
        
        return df
    
    def crear_caracteristicas(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Crea características adicionales para el modelo ML
        """
        df = df.copy()
        
        # Asegurar que la columna fecha sea datetime
        df['fecha'] = pd.to_datetime(df['fecha'])
        
        # Características temporales
        df['dia_año'] = df['fecha'].dt.dayofyear
        df['mes'] = df['fecha'].dt.month
        df['dia_semana'] = df['fecha'].dt.dayofweek
        
        # Características de tendencia (ventanas móviles)
        df['radiacion_media_7d'] = df['radiacion_solar'].rolling(window=7, min_periods=1).mean()
        df['radiacion_std_7d'] = df['radiacion_solar'].rolling(window=7, min_periods=1).std()
        df['temperatura_media_3d'] = df['temperatura'].rolling(window=3, min_periods=1).mean()
        df['humedad_media_3d'] = df['humedad'].rolling(window=3, min_periods=1).mean()
        
        # Características de lag (valores anteriores)
        df['radiacion_lag1'] = df['radiacion_solar'].shift(1)
        df['radiacion_lag2'] = df['radiacion_solar'].shift(2)
        df['radiacion_lag3'] = df['radiacion_solar'].shift(3)
        
        # Rellenar valores NaN usando el nuevo método
        df = df.ffill().bfill()
        
        return df
    
    def preparar_datos_entrenamiento(self, df: pd.DataFrame, dias_prediccion: int = 3) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepara los datos para entrenamiento del modelo
        """
        # Características para el modelo
        caracteristicas = [
            'temperatura', 'humedad', 'presion', 'velocidad_viento',
            'dia_año', 'mes', 'dia_semana',
            'radiacion_media_7d', 'radiacion_std_7d',
            'temperatura_media_3d', 'humedad_media_3d',
            'radiacion_lag1', 'radiacion_lag2', 'radiacion_lag3'
        ]
        
        X = df[caracteristicas].values
        y = df['radiacion_solar'].values
        
        # Crear secuencias para predicción multi-día
        X_secuencias = []
        y_secuencias = []
        
        for i in range(len(X) - dias_prediccion + 1):
            if i + dias_prediccion < len(y):
                X_secuencias.append(X[i])
                # Promedio de radiación para los próximos N días
                y_secuencias.append(np.mean(y[i+1:i+dias_prediccion+1]))
        
        return np.array(X_secuencias), np.array(y_secuencias)
    
    def entrenar_modelo_random_forest(self, X: np.ndarray, y: np.ndarray) -> Tuple[RandomForestRegressor, StandardScaler, float, float]:
        """
        Entrena un modelo Random Forest
        """
        # Normalizar características
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Entrenar modelo
        modelo = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        modelo.fit(X_scaled, y)
        
        # Calcular métricas
        y_pred = modelo.predict(X_scaled)
        r2 = r2_score(y, y_pred)
        mae = mean_absolute_error(y, y_pred)
        
        return modelo, scaler, r2, mae
    
    def entrenar_modelo_linear(self, X: np.ndarray, y: np.ndarray) -> Tuple[LinearRegression, StandardScaler, float, float]:
        """
        Entrena un modelo de Regresión Lineal
        """
        # Normalizar características
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Entrenar modelo
        modelo = LinearRegression()
        modelo.fit(X_scaled, y)
        
        # Calcular métricas
        y_pred = modelo.predict(X_scaled)
        r2 = r2_score(y, y_pred)
        mae = mean_absolute_error(y, y_pred)
        
        return modelo, scaler, r2, mae
    
    def entrenar_modelo_para_lote(self, lote: LoteCafe, metodo: str = 'random_forest', dias_datos: int = 90) -> Dict:
        """
        Entrena un modelo específico para un lote
        """
        try:
            # Obtener datos históricos
            df = self.obtener_datos_historicos(lote, dias_datos)
            
            if len(df) < 30:  # Mínimo de datos necesarios
                raise ValueError("Datos históricos insuficientes para entrenar el modelo")
            
            # Crear características
            df = self.crear_caracteristicas(df)
            
            # Preparar datos de entrenamiento
            X, y = self.preparar_datos_entrenamiento(df)
            
            # Entrenar según el método seleccionado
            if metodo == 'random_forest':
                modelo, scaler, r2, mae = self.entrenar_modelo_random_forest(X, y)
            elif metodo == 'linear_regression':
                modelo, scaler, r2, mae = self.entrenar_modelo_linear(X, y)
            else:
                raise ValueError(f"Método no soportado: {metodo}")
            
            # Guardar modelo y scaler
            modelo_key = f"{lote.id}_{metodo}"
            self.modelos_entrenados[modelo_key] = modelo
            self.scalers[modelo_key] = scaler
            
            # Guardar en disco
            self._guardar_modelo(modelo_key, modelo, scaler)
            
            return {
                'exito': True,
                'metodo': metodo,
                'r2_score': r2,
                'mae_score': mae,
                'datos_entrenamiento': len(X),
                'modelo_key': modelo_key
            }
            
        except Exception as e:
            return {
                'exito': False,
                'error': str(e)
            }
    
    def _guardar_modelo(self, modelo_key: str, modelo, scaler):
        """Guarda el modelo y scaler en disco"""
        try:
            joblib.dump(modelo, f"{self.directorio_modelos}/{modelo_key}_modelo.pkl")
            joblib.dump(scaler, f"{self.directorio_modelos}/{modelo_key}_scaler.pkl")
        except Exception as e:
            print(f"Error guardando modelo {modelo_key}: {e}")
    
    def _cargar_modelo(self, modelo_key: str) -> Tuple[Optional[object], Optional[StandardScaler]]:
        """Carga el modelo y scaler desde disco"""
        try:
            modelo = joblib.load(f"{self.directorio_modelos}/{modelo_key}_modelo.pkl")
            scaler = joblib.load(f"{self.directorio_modelos}/{modelo_key}_scaler.pkl")
            return modelo, scaler
        except Exception as e:
            print(f"Error cargando modelo {modelo_key}: {e}")
            return None, None
    
    def generar_prediccion(self, lote: LoteCafe, usuario, tipo_prediccion: str = '3_dias', 
                          metodo: str = 'random_forest') -> Dict:
        """
        Genera una predicción de radiación solar
        """
        try:
            # Mapear tipo de predicción a días
            dias_mapa = {'1_dia': 1, '3_dias': 3, '7_dias': 7}
            dias_prediccion = dias_mapa.get(tipo_prediccion, 3)
            
            # Establecer semilla reproducible basada en los parámetros
            # Esto garantiza predicciones consistentes con los mismos inputs
            seed = hash((lote.id, tipo_prediccion, metodo)) % (2**32)
            np.random.seed(seed)
            
            # Verificar si existe modelo entrenado
            modelo_key = f"{lote.id}_{metodo}"
            modelo = self.modelos_entrenados.get(modelo_key)
            scaler = self.scalers.get(modelo_key)
            
            # Si no está en memoria, intentar cargar desde disco
            if modelo is None or scaler is None:
                modelo, scaler = self._cargar_modelo(modelo_key)
            
            # Si aún no existe, entrenar nuevo modelo
            if modelo is None or scaler is None:
                resultado_entrenamiento = self.entrenar_modelo_para_lote(lote, metodo)
                if not resultado_entrenamiento['exito']:
                    return {
                        'exito': False,
                        'error': f"No se pudo entrenar el modelo: {resultado_entrenamiento['error']}"
                    }
                
                modelo = self.modelos_entrenados[modelo_key]
                scaler = self.scalers[modelo_key]
            
            # Obtener datos actuales para la predicción
            df_actual = self.obtener_datos_historicos(lote, 30)  # Últimos 30 días
            df_actual = self.crear_caracteristicas(df_actual)
            
            # Usar los datos más recientes para predicción
            ultimo_registro = df_actual.iloc[-1]
            
            # Preparar características para predicción
            caracteristicas = [
                'temperatura', 'humedad', 'presion', 'velocidad_viento',
                'dia_año', 'mes', 'dia_semana',
                'radiacion_media_7d', 'radiacion_std_7d',
                'temperatura_media_3d', 'humedad_media_3d',
                'radiacion_lag1', 'radiacion_lag2', 'radiacion_lag3'
            ]
            
            X_prediccion = ultimo_registro[caracteristicas].values.reshape(1, -1)
            X_prediccion_scaled = scaler.transform(X_prediccion)
            
            # Generar predicciones para múltiples días
            predicciones = []
            confianza_acumulada = 100.0
            
            for dia in range(dias_prediccion):
                # Predicción base
                pred_base = modelo.predict(X_prediccion_scaled)[0]
                
                # Agregar variabilidad basada en el día de predicción
                variabilidad = np.random.normal(0, float(pred_base) * 0.05 * (dia + 1))
                prediccion_dia = max(0, pred_base + variabilidad)
                
                predicciones.append(round(prediccion_dia, 2))
                
                # Reducir confianza con cada día adicional
                confianza_acumulada *= 0.9
            
            # Calcular nivel de riesgo
            nivel_riesgo = self._evaluar_riesgo_prediccion(lote, predicciones)
            
            # Determinar si generar alerta
            alerta_generada = nivel_riesgo in ['alto', 'critico'] and confianza_acumulada > 70
            
            # Obtener datos actuales del último registro
            datos_actuales = DatosClimaticos.objects.filter(
                lote=lote
            ).order_by('-fecha_medicion').first()
            
            if not datos_actuales:
                return {
                    'exito': False,
                    'error': "No hay datos climáticos actuales disponibles"
                }
            
            # Crear registro de predicción
            prediccion = PrediccionRadiacion.objects.create(
                lote=lote,
                usuario=usuario,
                tipo_prediccion=tipo_prediccion,
                metodo_utilizado=metodo,
                radiacion_actual=datos_actuales.irradiancia_solar,
                temperatura_actual=datos_actuales.temperatura,
                humedad_actual=datos_actuales.humedad_relativa,
                radiacion_predicha=predicciones,
                confianza_prediccion=round(confianza_acumulada, 2),
                datos_historicos_usados=len(df_actual),
                nivel_riesgo_predicho=nivel_riesgo,
                alerta_generada=alerta_generada
            )
            
            return {
                'exito': True,
                'prediccion_id': prediccion.id,
                'predicciones': predicciones,
                'confianza': round(confianza_acumulada, 2),
                'nivel_riesgo': nivel_riesgo,
                'alerta_generada': alerta_generada,
                'metodo_utilizado': metodo,
                'datos_historicos': len(df_actual)
            }
            
        except Exception as e:
            return {
                'exito': False,
                'error': str(e)
            }
    
    def _evaluar_riesgo_prediccion(self, lote: LoteCafe, predicciones: List[float]) -> str:
        """
        Evalúa el nivel de riesgo basado en las predicciones y umbrales
        """
        try:
            umbral = UmbralRadiacionSolar.objects.get(variedad=lote.variedad)
            
            # Contar días por nivel de riesgo
            dias_criticos = sum(1 for p in predicciones if p > float(umbral.radiacion_maxima) * 1.2)
            dias_altos = sum(1 for p in predicciones if p > float(umbral.radiacion_maxima))
            dias_bajos = sum(1 for p in predicciones if p < float(umbral.radiacion_minima))
            
            if dias_criticos > 0:
                return 'critico'
            elif dias_altos >= len(predicciones) // 2:
                return 'alto'
            elif dias_bajos >= len(predicciones) // 2:
                return 'bajo'
            else:
                return 'medio'
                
        except UmbralRadiacionSolar.DoesNotExist:
            return 'medio'  # Valor por defecto
    
    def verificar_precision_modelo(self, lote: LoteCafe, metodo: str = 'random_forest') -> Dict:
        """
        Verifica la precisión del modelo comparando predicciones pasadas con datos reales
        """
        try:
            # Obtener predicciones pasadas para verificar
            predicciones_pasadas = PrediccionRadiacion.objects.filter(
                lote=lote,
                metodo_utilizado=metodo,
                fecha_generacion__gte=timezone.now() - timedelta(days=30)
            ).order_by('-fecha_generacion')[:10]
            
            if not predicciones_pasadas:
                return {
                    'exito': False,
                    'error': "No hay predicciones pasadas para verificar"
                }
            
            errores = []
            for pred in predicciones_pasadas:
                # Verificar datos reales para las fechas predichas
                fecha_prediccion = pred.fecha_generacion.date()
                fecha_verificacion = fecha_prediccion + timedelta(days=1)
                
                dato_real = DatosClimaticos.objects.filter(
                    lote=lote,
                    fecha_medicion__date=fecha_verificacion
                ).first()
                
                if dato_real and isinstance(pred.radiacion_predicha, list) and len(pred.radiacion_predicha) > 0:
                    radiacion_real = float(dato_real.irradiancia_solar)
                    radiacion_predicha = pred.radiacion_predicha[0]  # Primer día de predicción
                    
                    error_absoluto = abs(radiacion_real - radiacion_predicha)
                    error_porcentual = (error_absoluto / radiacion_real) * 100 if radiacion_real > 0 else 0
                    
                    errores.append(error_porcentual)
            
            if errores:
                error_promedio = np.mean(errores)
                return {
                    'exito': True,
                    'error_promedio': round(error_promedio, 2),
                    'predicciones_verificadas': len(errores),
                    'necesita_reentrenamiento': error_promedio > 20  # Umbral del 20%
                }
            else:
                return {
                    'exito': False,
                    'error': "No se pudieron verificar las predicciones"
                }
                
        except Exception as e:
            return {
                'exito': False,
                'error': str(e)
            }


# Instancia global del servicio
servicio_ml = ServicioPrediccionML()