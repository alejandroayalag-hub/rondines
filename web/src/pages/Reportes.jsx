import { useState, useEffect } from 'react';
import { reportesAPI, turnosAPI, escaneosAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './Reportes.module.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
      <p style={{ color: 'var(--text-3)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function Reportes() {
  const [resumenHoy, setResumenHoy] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      // Resumen de hoy
      const hoyRes = await reportesAPI.resumen();
      setResumenHoy(hoyRes.data);

      // Histórico últimos 7 días
      const promises = Array.from({ length: 7 }, (_, i) => {
        const fecha = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
        return reportesAPI.resumen(fecha).then(r => ({
          dia: format(subDays(new Date(), 6 - i), 'EEE', { locale: es }).toUpperCase(),
          escaneos: r.data.total_escaneos,
          alertas: r.data.alertas_pendientes,
          guardias: r.data.guardias_activos,
        }));
      });
      const hist = await Promise.all(promises);
      setHistorico(hist);

      // Últimos turnos
      const turnosRes = await turnosAPI.listar({ limit: 20 });
      setTurnos(turnosRes.data.turnos || []);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>REPORTES</h1>
          <p className={styles.sub}>Últimos 7 días · {format(new Date(), "d 'de' MMMM yyyy", { locale: es }).toUpperCase()}</p>
        </div>
        <button className={styles.refreshBtn} onClick={cargar}>ACTUALIZAR</button>
      </div>

      {/* KPIs de hoy */}
      <div className={styles.kpiRow}>
        {[
          { label: 'ESCANEOS HOY', value: resumenHoy?.total_escaneos },
          { label: 'GUARDIAS EN TURNO', value: resumenHoy?.guardias_activos, color: 'var(--primary)' },
          { label: 'ALERTAS PENDIENTES', value: resumenHoy?.alertas_pendientes, color: resumenHoy?.alertas_pendientes > 0 ? 'var(--danger)' : undefined },
          { label: 'IRREGULARIDADES', value: resumenHoy?.escaneos_fuera_rango, color: resumenHoy?.escaneos_fuera_rango > 0 ? 'var(--warning)' : undefined },
        ].map(({ label, value, color }) => (
          <div key={label} className={styles.kpi}>
            <div className={styles.kpiLabel}>{label}</div>
            <div className={styles.kpiValue} style={color ? { color } : {}}>{cargando ? '…' : (value ?? 0)}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>ESCANEOS POR DÍA (7 DÍAS)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={historico} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="dia" tick={{ fill: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="escaneos" name="Escaneos" fill="var(--primary)" opacity={0.8} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartTitle}>ALERTAS POR DÍA (7 DÍAS)</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={historico}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="dia" tick={{ fill: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="alertas" name="Alertas" stroke="var(--danger)" strokeWidth={2} dot={{ fill: 'var(--danger)', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Últimos turnos */}
      <div className={styles.tableCard}>
        <div className={styles.tableTitle}>ÚLTIMOS TURNOS</div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>GUARDIA</th>
              <th>RUTA</th>
              <th>INICIO</th>
              <th>FIN</th>
              <th>ESCANEOS</th>
              <th>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="6" className={styles.loadingCell}>CARGANDO...</td></tr>
            ) : turnos.length === 0 ? (
              <tr><td colSpan="6" className={styles.loadingCell}>Sin turnos registrados</td></tr>
            ) : (
              turnos.map((t) => (
                <tr key={t.id} className={styles.row}>
                  <td className={styles.boldCell}>{t.guardia_nombre}</td>
                  <td className={styles.monoCell}>{t.ruta_nombre || '—'}</td>
                  <td className={styles.monoCell}>{format(new Date(t.inicio), 'dd/MM HH:mm')}</td>
                  <td className={styles.monoCell}>{t.fin ? format(new Date(t.fin), 'dd/MM HH:mm') : '—'}</td>
                  <td className={styles.monoCell}>{t.total_escaneos}</td>
                  <td>
                    <span className={`badge ${t.activo ? 'badge-ok' : 'badge-off'}`}>
                      {t.activo ? 'ACTIVO' : 'FINALIZADO'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
