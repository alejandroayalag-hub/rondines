import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

const NAV = [
  { to: '/',        label: '◈ CONTROL',   exact: true },
  { to: '/mapa',    label: '◎ MAPA VIVO' },
  { to: '/alertas', label: '◉ ALERTAS'   },
  { to: '/reportes',label: '▤ REPORTES'  },
  { to: '/puntos',  label: '⊞ PUNTOS QR' },
];

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={styles.root}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>🛡</div>
          <div>
            <div className={styles.brandName}>GRUPO ATA</div>
            <div className={styles.brandSub}>RONDINES</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navActive : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.userArea}>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{usuario?.nombre}</div>
            <div className={styles.userRole}>{usuario?.rol?.toUpperCase()}</div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Cerrar sesión">
            ⏻
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
