import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../users/AuthContext';
import { useNavigation } from '../navigation/NavigationContext';
import { useDashboardStats } from './useDashboardStats';
import styles from './Dashboard.module.css';
import { BACKGROUND_IMAGE_URL, BACKGROUND_BLUR, OVERLAY_OPACITY } from '../../config/backgroundConfig';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { navigateTo } = useNavigation();
  const { stats, loading: statsLoading } = useDashboardStats();
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar saludo según la hora
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) {
        setGreeting('Buenos días');
      } else if (hour < 18) {
        setGreeting('Buenas tardes');
      } else {
        setGreeting('Buenas noches');
      }
    };

    updateGreeting();
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      updateGreeting();
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, []);

  // Las estadísticas ahora vienen del hook useDashboardStats()

  const quickActions = [
    {
      icon: '🌱',
      title: 'Gestionar Cultivos',
      description: 'Administra tus lotes de café',
      color: '#52b788',
      action: 'cultivos'
    },
    {
      icon: '🌤️',
      title: 'Dashboard Clima',
      description: 'Datos meteorológicos en tiempo real',
      color: '#74c69d',
      action: 'clima'
    },
    {
      icon: '🤖',
      title: 'Predicciones ML',
      description: 'Inteligencia artificial para tu cultivo',
      color: '#95d5b2',
      action: 'predicciones'
    },
    {
      icon: '👤',
      title: 'Mi Perfil',
      description: 'Configuración de cuenta',
      color: '#b7e4c7',
      action: 'profile'
    }
  ];

  return (
    <div className={styles.dashboardContainer}>
      {/* Imagen de fondo */}
      <div
        className={styles.backgroundImage}
        style={{
          backgroundImage: `url(${BACKGROUND_IMAGE_URL})`,
          filter: `blur(${BACKGROUND_BLUR}px)`
        }}
      ></div>
      <div
        className={styles.overlay}
        style={{
          background: `linear-gradient(
            to right,
            rgba(0, 0, 0, ${OVERLAY_OPACITY.left}) 0%,
            rgba(0, 0, 0, ${OVERLAY_OPACITY.center}) 15%,
            rgba(0, 0, 0, ${OVERLAY_OPACITY.center}) 50%,
            rgba(0, 0, 0, ${OVERLAY_OPACITY.right}) 100%
          )`
        }}
      ></div>

      {/* Contenido principal */}
      <div className={styles.content}>
        {/* Tarjeta de bienvenida */}
        <div className={styles.welcomeCard}>
          <div className={styles.welcomeHeader}>
            <div>
              <h1 className={styles.welcomeTitle}>
                {greeting}, {user?.first_name || user?.username || 'Caficultor'}! ☕
              </h1>
              <p className={styles.welcomeSubtitle}>
                Bienvenido al Sistema de Cultivo de Café
              </p>
            </div>
            <div className={styles.timeDisplay}>
              <div className={styles.time}>
                {currentTime.toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className={styles.date}>
                {currentTime.toLocaleDateString('es-CO', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          <p className={styles.welcomeMessage}>
            Usa el menú para navegar entre los módulos o selecciona una acción rápida a continuación.
          </p>
        </div>

        {/* Estadísticas rápidas */}
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <div
              key={index}
              className={styles.statCard}
              style={{ '--stat-color': stat.color }}
            >
              <div className={styles.statIcon}>{stat.icon}</div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>
                  {statsLoading && stat.value === '...' ? (
                    <span className={styles.loading}>⏳</span>
                  ) : (
                    stat.value
                  )}
                </div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Sección de funcionalidades */}
        <div className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>
            <span>✨</span> Funcionalidades Disponibles
          </h2>

          <div className={styles.featuresGrid}>
            {quickActions.map((action, index) => (
              <div
                key={index}
                className={styles.featureCard}
                style={{ '--feature-color': action.color }}
              >
                <div className={styles.featureIcon}>{action.icon}</div>
                <h3 className={styles.featureTitle}>{action.title}</h3>
                <p className={styles.featureDescription}>{action.description}</p>
                <button
                  className={styles.featureButton}
                  onClick={() => navigateTo(action.action)}
                >
                  Acceder →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Información adicional */}
        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>🌿</div>
            <div className={styles.infoContent}>
              <h3>Monitoreo en Tiempo Real</h3>
              <p>Sistema conectado con NASA POWER para datos climáticos precisos</p>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>🎯</div>
            <div className={styles.infoContent}>
              <h3>Predicciones Inteligentes</h3>
              <p>Machine Learning para anticipar condiciones de radiación solar</p>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>📊</div>
            <div className={styles.infoContent}>
              <h3>Análisis Detallados</h3>
              <p>Visualización de datos históricos y tendencias de tu cultivo</p>
            </div>
          </div>
        </div>

        {/* Footer decorativo */}
        <div className={styles.dashboardFooter}>
          <p>🌱 CoffeeWatch - Sistema Inteligente de Cultivo de Café</p>
          <p>Desarrollado con ❤️ para caficultores colombianos</p>
        </div>
      </div>
    </div>
  );
}

