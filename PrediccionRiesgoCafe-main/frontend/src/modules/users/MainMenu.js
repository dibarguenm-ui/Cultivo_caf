import React, { useContext } from 'react';
import Profile from './Profile';
import { AuthContext } from './AuthContext';
import { NavigationProvider, useNavigation } from '../navigation/NavigationContext';
import LotesList from '../cultivos/LotesList';
import DashboardClima from '../clima/DashboardClima';
import { Predicciones } from '../predicciones';
import Dashboard from '../dashboard/Dashboard';
import styles from './Menu.module.css';

const menuItems = [
  { key: 'home', label: 'Inicio' },
  { key: 'profile', label: 'Mi Perfil' },
  { key: 'cultivos', label: 'Cultivos' },
  { key: 'clima', label: 'Clima' },
  { key: 'predicciones', label: 'Predicciones ML' },
];

function MainMenuContent() {
  const { currentPage, navigateTo } = useNavigation();
  const { logout } = useContext(AuthContext);

  return (
    <div style={{display:'flex', minHeight:'100vh'}}>
      <aside className={styles.menuContainer}>
        <nav className={styles.menu}>
          {menuItems.map(item => (
            <button
              key={item.key}
              className={currentPage === item.key ? `${styles.menuButton} ${styles.active}` : styles.menuButton}
              onClick={() => navigateTo(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button className={styles.logout} onClick={logout}>Cerrar sesión</button>
      </aside>
      <main style={{flex:1, padding:'0', overflow: 'auto'}}>
        {currentPage === 'home' && <Dashboard />}
        {currentPage === 'profile' && <Profile />}
        {currentPage === 'cultivos' && <LotesList />}
        {currentPage === 'clima' && <DashboardClima />}
        {currentPage === 'predicciones' && <Predicciones />}
      </main>
    </div>
  );
}

export default function MainMenu() {
  return (
    <NavigationProvider>
      <MainMenuContent />
    </NavigationProvider>
  );
}
