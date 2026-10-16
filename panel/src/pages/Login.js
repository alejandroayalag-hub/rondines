import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Fondo con patrón */}
      <div style={styles.bg} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <img src="/logo.png" alt="Grupo ATA" style={styles.logo} />
        </div>

        {/* Títulos */}
        <h1 style={styles.title}>Grupo ATA</h1>
        <p style={styles.subtitle}>Sistema de Control de Rondines</p>
        <div style={styles.divider} />

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Correo electrónico</label>
            <input
              style={styles.input}
              type="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button style={{ ...styles.btn, opacity: cargando ? 0.8 : 1 }} type="submit" disabled={cargando}>
            {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <p style={styles.footer}>Servicios ATA © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0A1628 0%, #0D2257 50%, #0A1628 100%)',
    position: 'relative',
    overflow: 'hidden',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(29,78,216,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.1) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  card: {
    background: 'rgba(255,255,255,0.97)',
    borderRadius: 20,
    padding: '40px 44px',
    width: 400,
    textAlign: 'center',
    boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
    position: 'relative',
    zIndex: 1,
  },
  logoWrap: {
    width: 110,
    height: 110,
    borderRadius: '50%',
    background: '#fff',
    border: '3px solid #1D4ED8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    boxShadow: '0 4px 20px rgba(29,78,216,0.2)',
    overflow: 'hidden',
  },
  logo: {
    width: 100,
    height: 100,
    objectFit: 'contain',
  },
  title: {
    color: '#0D2257',
    fontSize: 24,
    fontWeight: 800,
    marginBottom: 4,
    letterSpacing: 1,
  },
  subtitle: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: 1,
    marginBottom: 20,
  },
  divider: {
    height: 2,
    background: 'linear-gradient(90deg, transparent, #1D4ED8, transparent)',
    marginBottom: 24,
    borderRadius: 1,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    textAlign: 'left',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    background: '#F9FAFB',
    border: '1.5px solid #D1D5DB',
    borderRadius: 10,
    padding: '12px 14px',
    color: '#111827',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  error: {
    background: '#FEF2F2',
    border: '1px solid #FCA5A5',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },
  btn: {
    background: 'linear-gradient(135deg, #1D4ED8, #2563EB)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '13px',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    letterSpacing: 0.5,
    marginTop: 4,
    boxShadow: '0 4px 15px rgba(29,78,216,0.4)',
  },
  footer: {
    marginTop: 24,
    fontSize: 11,
    color: '#9CA3AF',
    letterSpacing: 1,
  },
};
