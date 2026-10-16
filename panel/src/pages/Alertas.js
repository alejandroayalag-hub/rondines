import { useState, useEffect, useCallback } from 'react';
import { alertasAPI } from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './Alertas.module.css';

const TIPOS = { all: 'TODAS', no_escaneo: 'SIN ESCANEO', fuera_de_rango: 'FUERA RANGO', sos: 'SOS', turno_no_iniciado: 'TURNO' };

export default function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [filtro, setFiltro] = useState({ tipo: 'all', resuelta: false });
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = {};
      if (filtro.tipo !== 'all') params.tipo = filtro.tipo;
      if (filtro.resuelta !== 'all') params.resuelta = filtro.resuelta;
      const res = await alertasAPI.listar(params);
      setAlertas(res.data.alertas || []);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  }, [filtro]);

  useEffect(() => { cargar(); }, [cargar]);

  const resolver = async (id) => {
    try {
      await alertasAPI.resolver(id);
      setAlertas(prev => prev.filter(a => a.id !== id));
    } catch (e) { console.error(e); }
  };

  const badgeClass = (tipo) => ({
    sos: 'badge-danger',
    fuera_de_rango: 'badge-warning',
    no_escaneo: 'badge-off',
    turno_no_iniciado: 'badge-off',
  }[tipo] || 'badge-off');

  const tipoLabel = (tipo) => ({
    sos: '🆘 SOS',
    fuera_de_rango: '⚠ RANGO',
    no_escaneo: '⏱ TIEMPO',
    turno_no_iniciado: '⏻ TURNO',
  }[tipo] || tipo);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>ALERTAS</h1>
          <p className={styles.sub}>{alertas.length} resultado{alertas.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filtros}>
        <div className={styles.filtroGroup}>
          {Object.entries(TIPOS).map(([key, label]) => (
            <button
              key={key}
              className={`${styles.filtroBtn} ${filtro.tipo === key ? styles.filtroActive : ''}`}
              onClick={() => setFiltro(f => ({ ...f, tipo: key }))}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.filtroGroup}>
          <button
            className={`${styles.filtroBtn} ${!filtro.resuelta ? styles.filtroActive : ''}`}
            onClick={() => setFiltro(f => ({ ...f, resuelta: false }))}
          >PENDIENTES</button>
          <button
            className={`${styles.filtroBtn} ${filtro.resuelta === true ? styles.filtroActive : ''}`}
            onClick={() => setFiltro(f => ({ ...f, resuelta: true }))}
          >RESUELTAS</button>
          <button
            className={`${styles.filtroBtn} ${filtro.resuelta === 'all' ? styles.filtroActive : ''}`}
            onClick={() => setFiltro(f => ({ ...f, resuelta: 'all' }))}
          >TODAS</button>
        </div>
      </div>

      {/* Tabla */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>TIPO</th>
              <th>GUARDIA</th>
              <th>MENSAJE</th>
              <th>FECHA/HORA</th>
              <th>ESTADO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="6" className={styles.loading}>CARGANDO...</td></tr>
            ) : alertas.length === 0 ? (
              <tr><td colSpan="6" className={styles.empty}>Sin alertas con los filtros seleccionados</td></tr>
            ) : (
              alertas.map((a) => (
                <tr key={a.id} className={`${styles.row} ${a.tipo === 'sos' ? styles.rowSOS : ''}`}>
                  <td>
                    <span className={`badge ${badgeClass(a.tipo)}`}>{tipoLabel(a.tipo)}</span>
                  </td>
                  <td className={styles.guardiaCell}>{a.guardia_nombre || '—'}</td>
                  <td className={styles.mensajeCell}>{a.mensaje}</td>
                  <td className={styles.monoCell}>
                    {format(new Date(a.created_at), "dd/MM/yy HH:mm", { locale: es })}
                  </td>
                  <td>
                    <span className={`badge ${a.resuelta ? 'badge-ok' : 'badge-danger'}`}>
                      {a.resuelta ? 'RESUELTA' : 'PENDIENTE'}
                    </span>
                  </td>
                  <td>
                    {!a.resuelta && (
                      <button className={styles.resolverBtn} onClick={() => resolver(a.id)}>
                        ✓ RESOLVER
                      </button>
                    )}
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
