import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/',          label: 'Dashboard',    icon: '⊞' },
  { to: '/mapa',      label: 'Mapa en Vivo', icon: '◎' },
  { to: '/alertas',   label: 'Alertas',      icon: '⚠' },
  { to: '/reportes',  label: 'Reportes',     icon: '▦' },
  { to: '/puntos',    label: 'Puntos QR',    icon: '⊡' },
  { to: '/guardias',  label: 'Guardias',     icon: '👤', soloSuperior: true },
];

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside style={styles.sidebar}>
      {/* Header con logo */}
      <div style={styles.header}>
        <div style={styles.logoWrap}>
          <img src="/logo.png" alt="Grupo ATA" style={styles.logoImg} />
        </div>
        <div style={styles.logoTexts}>
          <span style={styles.logoTitle}>Grupo ATA</span>
          <span style={styles.logoSub}>Control de Rondines</span>
        </div>
      </div>

      <div style={styles.divider} />

      {/* Navegación */}
      <nav style={styles.nav}>
        {links.filter(l => !l.soloSuperior || ['admin','supervisor'].includes(usuario?.rol)).map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.linkActive : {}),
          })}>
            <span style={styles.icon}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer con usuario */}
      <div style={styles.footer}>
        <div style={styles.user}>
          <div style={styles.userAvatar}>
            {usuario?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={styles.userName}>{usuario?.nombre}</div>
            <div style={styles.userRole}>{usuario?.rol}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          ⏻ Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 230,
    background: 'linear-gradient(180deg, #0D2257 0%, #0A1628 100%)',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '20px 16px',
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: '#fff',
    border: '2px solid rgba(255,255,255,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  logoImg: {
    width: 42,
    height: 42,
    objectFit: 'contain',
  },
  logoTexts: {
    display: 'flex',
    flexDirection: 'column',
  },
  logoTitle: {
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  logoSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.08)',
    margin: '0 16px 8px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '0 10px',
    flex: 1,
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.15s',
  },
  linkActive: {
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    borderLeft: '3px solid #3B82F6',
    paddingLeft: 9,
  },
  icon: {
    fontSize: 16,
    width: 20,
    textAlign: 'center',
  },
  footer: {
    padding: '12px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    marginTop: 8,
  },
  user: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    padding: '8px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#1D4ED8',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  userName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
  },
  userRole: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 1,
  },
  logoutBtn: {
    width: '100%',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.5)',
    padding: '8px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 12,
    letterSpacing: 0.5,
  },
};
