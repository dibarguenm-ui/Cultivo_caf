import React, { useContext, useState } from 'react';
import Profile from './Profile';
import { AuthContext } from './AuthContext';
import LotesList from '../cultivos/LotesList';
import DashboardClima from '../clima/DashboardClima';
import { Predicciones } from '../predicciones';
import styles from './Menu.module.css';

const menuItems = [
  { key: 'home', label: 'Inicio', icon: '🏠' },
  { key: 'profile', label: 'Mi Perfil', icon: '👤' },
  { key: 'cultivos', label: 'Cultivos', icon: '🌱' },
  { key: 'clima', label: 'Clima', icon: '🌤️' },
  { key: 'predicciones', label: 'Predicciones ML', icon: '🤖' },
];

export default function MainMenu() {
  const [page, setPage] = useState('home');
  const { logout, user } = useContext(AuthContext);

  return (
    <div style={{display:'flex', minHeight:'100vh', background: 'var(--color-background)'}}>
      {/* Sidebar con diseño moderno */}
      <aside className={styles.menuContainer}>
        {/* Header con logo */}
        <div className={styles.menuHeader}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>☕</span>
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>CoffeeWatch</span>
              <span className={styles.logoSubtitle}>Sistema Inteligente</span>
            </div>
          </div>
        </div>

        {/* Navegación principal */}
        <nav className={styles.menu}>
          {menuItems.map(item => (
            <button
              key={item.key}
              className={page === item.key ? `${styles.menuButton} ${styles.active}` : styles.menuButton}
              onClick={() => setPage(item.key)}
            >
              <span className={styles.menuIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer con info de usuario */}
        <div className={styles.menuFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userName}>
              {user?.first_name || user?.username || 'Usuario'}
            </div>
            <div className={styles.userEmail}>
              {user?.email || 'usuario@example.com'}
            </div>
          </div>
          <button className={styles.logout} onClick={logout}>
            <span>🚪</span> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal con diseño mejorado */}
      <main style={{
        flex: 1,
        padding: '2.5rem',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}>
        {page === 'home' && (
          <div className="fade-in" style={{textAlign:'center', padding: '3rem 0'}}>
            {/* Hero Section */}
            <div style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
              borderRadius: 'var(--radius-xl)',
              padding: '4rem 2rem',
              color: 'white',
              marginBottom: '3rem',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                fontSize: '5rem',
                marginBottom: '1rem',
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))'
              }}>☕</div>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                Bienvenido a CoffeeWatch
              </h1>
              <p style={{
                fontSize: '1.2rem',
                opacity: 0.95,
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Sistema inteligente para la gestión y predicción climática de cultivos de café
              </p>
            </div>

            {/* Tarjetas de características */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
              marginTop: '3rem'
            }}>
              <FeatureCard
                icon="🤖"
                title="Predicciones ML"
                description="Predicción inteligente de radiación solar usando Machine Learning"
              />
              <FeatureCard
                icon="🌤️"
                title="Dashboard Clima"
                description="Visualización de datos meteorológicos en tiempo real de NASA POWER"
              />
              <FeatureCard
                icon="🌱"
                title="Gestión de Cultivos"
                description="Administra tus lotes de café con geolocalización automática"
              />
            </div>
          </div>
        )}
        {page === 'profile' && <Profile />}
        {page === 'cultivos' && <LotesList />}
        {page === 'clima' && <DashboardClima />}
        {page === 'predicciones' && <Predicciones />}
      </main>
    </div>
  );
}

// Componente de tarjeta reutilizable
function FeatureCard({ icon, title, description }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        background: 'white',
        padding: '2rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: isHovered ? 'var(--shadow-xl)' : 'var(--shadow-md)',
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{fontSize: '3rem', marginBottom: '1rem'}}>{icon}</div>
      <h3 style={{
        fontSize: '1.3rem',
        color: 'var(--color-primary)',
        marginBottom: '0.5rem',
        fontWeight: '600'
      }}>{title}</h3>
      <p style={{
        color: 'var(--color-text-light)',
        lineHeight: '1.6',
        fontSize: '0.95rem'
      }}>{description}</p>
    </div>
  );
}

