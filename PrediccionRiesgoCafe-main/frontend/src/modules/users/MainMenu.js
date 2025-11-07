import React, { useContext, useState } from 'react';
import Profile from './Profile';
import { AuthContext } from './AuthContext';
import LotesList from '../cultivos/LotesList';
import DashboardClima from '../clima/DashboardClima';
import { Predicciones } from '../predicciones';
import styles from './Menu.module.css';

const menuItems = [
  { key: 'home', label: 'Inicio' },
  { key: 'profile', label: 'Mi Perfil' },
  { key: 'cultivos', label: 'Cultivos' },
  { key: 'clima', label: 'Clima' },
  { key: 'predicciones', label: 'Predicciones ML' },
];

export default function MainMenu() {
  const [page, setPage] = useState('home');
  const { logout } = useContext(AuthContext);

  return (
    <div style={{display:'flex', minHeight:'100vh'}}>
      <aside className={styles.menuContainer}>
        <nav className={styles.menu}>
          {menuItems.map(item => (
            <button
              key={item.key}
              className={page === item.key ? `${styles.menuButton} ${styles.active}` : styles.menuButton}
              onClick={() => setPage(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button className={styles.logout} onClick={logout}>Cerrar sesión</button>
      </aside>
      <main style={{flex:1, padding:'2rem'}}>
        {page === 'home' && (
          <div style={{textAlign:'center'}}>
            <h2>Bienvenido al Sistema de Cultivo de Café</h2>
            <p>Usa el menú para navegar entre los módulos.</p>
            <div style={{marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px'}}>
              <h3>Funcionalidades Disponibles:</h3>
              <ul style={{textAlign: 'left', maxWidth: '400px', margin: '0 auto'}}>
                <li><strong>Predicciones ML</strong>: Predicción inteligente de radiación solar</li>
                <li><strong>Dashboard Clima</strong>: Visualización de datos meteorológicos</li>
                <li><strong>Gestión de Cultivos</strong>: Administra tus lotes de café</li>
              </ul>
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