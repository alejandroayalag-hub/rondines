import { useState, useEffect } from 'react';
import { puntosAPI } from '../services/api';
import styles from './Puntos.module.css';

export default function Puntos() {
  const [puntos, setPuntos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', latitud: '', longitud: '', radio_tolerancia_metros: 50, orden: 0 });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await puntosAPI.listar();
      setPuntos(res.data.puntos || []);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await puntosAPI.crear({
        ...form,
        latitud: form.latitud || undefined,
        longitud: form.longitud || undefined,
        radio_tolerancia_metros: parseInt(form.radio_tolerancia_metros),
        orden: parseInt(form.orden),
      });
      setShowForm(false);
      setForm({ nombre: '', descripcion: '', latitud: '', longitud: '', radio_tolerancia_metros: 50, orden: 0 });
      await cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al crear el punto');
    } finally { setGuardando(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>PUNTOS QR</h1>
          <p className={styles.sub}>{puntos.length} puntos de rondín registrados</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ CANCELAR' : '+ NUEVO PUNTO'}
        </button>
      </div>

      {/* Formulario nuevo punto */}
      {showForm && (
        <form className={styles.form} onSubmit={handleGuardar}>
          <div className={styles.formTitle}>◎ REGISTRAR NUEVO PUNTO DE RONDÍN</div>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>NOMBRE DEL PUNTO *</label>
              <input className={styles.input} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Entrada Principal" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>DESCRIPCIÓN</label>
              <input className={styles.input} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción opcional" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>LATITUD GPS</label>
              <input className={styles.input} type="number" step="any" value={form.latitud} onChange={e => setForm(f => ({ ...f, latitud: e.target.value }))} placeholder="19.4195" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>LONGITUD GPS</label>
              <input className={styles.input} type="number" step="any" value={form.longitud} onChange={e => setForm(f => ({ ...f, longitud: e.target.value }))} placeholder="-102.0630" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>RADIO TOLERANCIA (metros)</label>
              <input className={styles.input} type="number" value={form.radio_tolerancia_metros} onChange={e => setForm(f => ({ ...f, radio_tolerancia_metros: e.target.value }))} min="5" max="500" />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>ORDEN EN RUTA</label>
              <input className={styles.input} type="number" value={form.orden} onChange={e => setForm(f => ({ ...f, orden: e.target.value }))} min="0" />
            </div>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.formActions}>
            <button type="submit" className={styles.saveBtn} disabled={guardando}>
              {guardando ? 'GUARDANDO...' : 'CREAR PUNTO Y GENERAR QR'}
            </button>
          </div>
        </form>
      )}

      {/* Tabla de puntos */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>NOMBRE</th>
              <th>CÓDIGO QR</th>
              <th>COORDENADAS</th>
              <th>RADIO</th>
              <th>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="6" className={styles.loadingCell}>CARGANDO...</td></tr>
            ) : puntos.length === 0 ? (
              <tr><td colSpan="6" className={styles.loadingCell}>Sin puntos registrados. Crea el primero.</td></tr>
            ) : (
              puntos.map((p, i) => (
                <tr key={p.id} className={styles.row}>
                  <td className={styles.orderCell}>{p.orden || i + 1}</td>
                  <td>
                    <div className={styles.puntoNombre}>{p.nombre}</div>
                    {p.descripcion && <div className={styles.puntoDesc}>{p.descripcion}</div>}
                  </td>
                  <td>
                    <code className={styles.qrCode}>{p.qr_codigo}</code>
                  </td>
                  <td className={styles.monoCell}>
                    {p.latitud && p.longitud
                      ? `${parseFloat(p.latitud).toFixed(5)}, ${parseFloat(p.longitud).toFixed(5)}`
                      : <span style={{ color: 'var(--text-3)' }}>Sin coordenadas</span>
                    }
                  </td>
                  <td className={styles.monoCell}>{p.radio_tolerancia_metros}m</td>
                  <td>
                    <span className={`badge ${p.activo ? 'badge-ok' : 'badge-off'}`}>
                      {p.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Instrucción de impresión QR */}
      <div className={styles.hint}>
        <span style={{ color: 'var(--primary)' }}>◎</span>
        <span>Para imprimir los códigos QR: usa el valor de la columna <strong style={{ color: 'var(--text-1)' }}>CÓDIGO QR</strong> en cualquier generador de QR en línea (qr-code-generator.com, goqr.me). Imprime y coloca en cada punto físico.</span>
      </div>
    </div>
  );
}
