import { useState, useEffect, useCallback } from 'react';
import { reportesAPI, alertasAPI } from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import styles from './Dashboard.module.css';

const REFRESH_INTERVAL = 30000; // 30 segundos

function StatCard({ label, value, sub, accent, blink }) {
  return (
    <div className={`${styles.statCard} ${accent ? styles[`accent_${accent}`] : ''}`}>
      <div className={styles.statLabel}>{label}</div>
      <div className={`${styles.statValue} ${blink ? styles.blinking : ''}`}
           style={accent === 'danger' ? { color: 'var(--danger)' }
                : accent === 'warning' ? { color: 'var(--warning)' }
                : accent === 'primary' ? { color: 'var(--primary)' } : {}}>
        {value ?? '—'}
      </div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [guardias, setGuardias] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const [resRes, guardRes, alertRes] = await Promise.all([
        reportesAPI.resumen(),
        reportesAPI.actividadTiempoReal(),
        alertasAPI.listar({ resuelta: false }),
      ]);
      setResumen(resRes.data);
      setGuardias(guardRes.data.guardias_activos || []);
      setAlertas(alertRes.data.alertas || []);
      setUltimaActualizacion(new Date());
    } catch (e) {
      console.error('Error cargando dashboard:', e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [cargar]);

  const resolver = async (id) => {
    try {
      await alertasAPI.resolver(id);
      setAlertas(prev => prev.filter(a => a.id !== id));
    } catch (e) { console.error(e); }
  };

  const tiempoSinEscaneo = (ultimoEscaneo) => {
    if (!ultimoEscaneo) return 'SIN ESCANEOS';
    const mins = Math.floor((new Date() - new Date(ultimoEscaneo)) / 60000);
    if (mins < 60) return `${mins} MIN`;
    return `${Math.floor(mins / 60)}H ${mins % 60}M`;
  };

  const estadoGuardia = (g) => {
    if (!g.ultimo_escaneo) return 'sin-escaneo';
    const mins = Math.floor((new Date() - new Date(g.ultimo_escaneo)) / 60000);
    if (mins < 30) return 'ok';
    if (mins < 60) return 'warning';
    return 'danger';
  };

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>CENTRO DE CONTROL</h1>
          <p className={styles.pageSub}>
            {format(new Date(), "EEEE d 'de' MMMM yyyy", { locale: es }).toUpperCase()}
          </p>
        </div>
        <div className={styles.headerRight}>
          {ultimaActualizacion && (
            <span className={styles.updated}>
              ↻ {format(ultimaActualizacion, 'HH:mm:ss')}
            </span>
          )}
          <button className={styles.refreshBtn} onClick={cargar}>
            ACTUALIZAR
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <StatCard
          label="GUARDIAS ACTIVOS"
          value={resumen?.guardias_activos ?? '…'}
          sub="en turno ahora"
          accent="primary"
        />
        <StatCard
          label="ESCANEOS HOY"
          value={resumen?.total_escaneos ?? '…'}
          sub="puntos registrados"
        />
        <StatCard
          label="ALERTAS PENDIENTES"
          value={resumen?.alertas_pendientes ?? '…'}
          sub="sin resolver"
          accent={resumen?.alertas_pendientes > 0 ? 'danger' : null}
          blink={resumen?.alertas_pendientes > 0}
        />
        <StatCard
          label="FUERA DE RANGO"
          value={resumen?.escaneos_fuera_rango ?? '…'}
          sub="escaneos irregulares"
          accent={resumen?.escaneos_fuera_rango > 0 ? 'warning' : null}
        />
      </div>

      {/* Main grid */}
      <div className={styles.mainGrid}>
        {/* Guardias activos */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>◈ GUARDIAS EN TURNO</span>
            <span className={styles.panelCount}>{guardias.length}</span>
          </div>
          <div className={styles.guardiasList}>
            {guardias.length === 0 ? (
              <div className={styles.empty}>
                <span>◎</span>
                <p>Sin guardias activos en este momento</p>
              </div>
            ) : (
              guardias.map((g) => {
                const estado = estadoGuardia(g);
                return (
                  <div key={g.id} className={`${styles.guardiaRow} ${styles[`estado_${estado}`]}`}>
                    <div className={`${styles.guardiaDot} ${styles[`dot_${estado}`]}`} />
                    <div className={styles.guardiaInfo}>
                      <div className={styles.guardiaNombre}>{g.nombre}</div>
                      <div className={styles.guardiaRuta}>{g.ruta_nombre || 'Sin ruta asignada'}</div>
                    </div>
                    <div className={styles.guardiaStats}>
                      <div className={styles.guardiaUltimo}>
                        {g.ultimo_punto || '—'}
                      </div>
                      <div className={`${styles.guardiaTime} ${estado === 'danger' ? styles.tiempoAlerta : ''}`}>
                        {tiempoSinEscaneo(g.ultimo_escaneo)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Alertas pendientes */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>◉ ALERTAS ACTIVAS</span>
            {alertas.length > 0 && (
              <span className={`${styles.panelCount} ${styles.alertCount}`}>
                {alertas.length}
              </span>
            )}
          </div>
          <div className={styles.alertasList}>
            {alertas.length === 0 ? (
              <div className={styles.empty}>
                <span style={{ color: 'var(--primary)' }}>✓</span>
                <p>Sin alertas pendientes</p>
              </div>
            ) : (
              alertas.slice(0, 8).map((a) => (
                <div key={a.id} className={`${styles.alertaRow} ${a.tipo === 'sos' ? styles.alertaSOS : ''}`}>
                  <div className={styles.alertaLeft}>
                    <span className={`badge ${a.tipo === 'sos' ? 'badge-danger' : a.tipo === 'fuera_de_rango' ? 'badge-warning' : 'badge-off'}`}>
                      {a.tipo === 'sos' ? '🆘 SOS' : a.tipo === 'fuera_de_rango' ? '⚠ RANGO' : '⏱ TIEMPO'}
                    </span>
                    <div className={styles.alertaNombre}>{a.guardia_nombre}</div>
                    <div className={styles.alertaMensaje}>{a.mensaje}</div>
                  </div>
                  <button
                    className={styles.resolverBtn}
                    onClick={() => resolver(a.id)}
                  >
                    ✓
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
