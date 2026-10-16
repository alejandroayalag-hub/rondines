import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { puntosAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './Puntos.module.css';

const FORM_VACIO = { nombre: '', descripcion: '', latitud: '', longitud: '', radio_tolerancia_metros: 50, orden: 0 };

function ModalQR({ punto, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    const contenido = printRef.current.innerHTML;
    const ventana = window.open('', '_blank');
    ventana.document.write(`
      <html>
        <head>
          <title>QR - ${punto.nombre}</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fff; }
            .qr-card { text-align: center; padding: 32px; border: 2px solid #000; border-radius: 12px; max-width: 300px; }
            .qr-card img, .qr-card svg { width: 200px; height: 200px; }
            .qr-nombre { font-size: 18px; font-weight: bold; margin-top: 16px; color: #000; }
            .qr-codigo { font-size: 11px; color: #666; margin-top: 6px; font-family: monospace; word-break: break-all; }
            .qr-empresa { font-size: 11px; color: #999; margin-top: 12px; text-transform: uppercase; letter-spacing: 1px; }
          </style>
        </head>
        <body>${contenido}</body>
      </html>
    `);
    ventana.document.close();
    ventana.print();
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <span style={modalStyles.title}>Código QR — {punto.nombre}</span>
          <button style={modalStyles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={modalStyles.body}>
          <div ref={printRef}>
            <div className="qr-card">
              <QRCodeSVG
                value={punto.qr_codigo}
                size={200}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                includeMargin={true}
              />
              <div className="qr-nombre">{punto.nombre}</div>
              <div className="qr-codigo">{punto.qr_codigo}</div>
              <div className="qr-empresa">Grupo ATA — Rondines</div>
            </div>
          </div>

          <div style={modalStyles.info}>
            <div style={modalStyles.infoRow}>
              <span style={modalStyles.infoLabel}>Código:</span>
              <code style={modalStyles.infoVal}>{punto.qr_codigo}</code>
            </div>
            {punto.latitud && (
              <div style={modalStyles.infoRow}>
                <span style={modalStyles.infoLabel}>GPS:</span>
                <span style={modalStyles.infoVal}>{parseFloat(punto.latitud).toFixed(5)}, {parseFloat(punto.longitud).toFixed(5)}</span>
              </div>
            )}
            <div style={modalStyles.infoRow}>
              <span style={modalStyles.infoLabel}>Radio:</span>
              <span style={modalStyles.infoVal}>{punto.radio_tolerancia_metros}m</span>
            </div>
          </div>
        </div>

        <div style={modalStyles.footer}>
          <button style={modalStyles.printBtn} onClick={handlePrint}>
            🖨 Imprimir QR
          </button>
        </div>
      </div>
    </div>
  );
}

function FormPunto({ inicial, onGuardar, onCancelar, guardando, error }) {
  const [form, setForm] = useState(inicial || FORM_VACIO);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const esEdicion = Boolean(inicial?.id);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar({
      ...form,
      latitud: form.latitud || undefined,
      longitud: form.longitud || undefined,
      radio_tolerancia_metros: parseInt(form.radio_tolerancia_metros),
      orden: parseInt(form.orden),
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formTitle}>
        {esEdicion ? `✏ EDITAR: ${inicial.nombre}` : '◎ REGISTRAR NUEVO PUNTO DE RONDÍN'}
      </div>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label className={styles.label}>NOMBRE DEL PUNTO *</label>
          <input className={styles.input} value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Entrada Principal" required />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>DESCRIPCIÓN</label>
          <input className={styles.input} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción opcional" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>LATITUD GPS</label>
          <input className={styles.input} type="number" step="any" value={form.latitud} onChange={e => set('latitud', e.target.value)} placeholder="20.5888" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>LONGITUD GPS</label>
          <input className={styles.input} type="number" step="any" value={form.longitud} onChange={e => set('longitud', e.target.value)} placeholder="-100.3899" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>RADIO TOLERANCIA (metros)</label>
          <input className={styles.input} type="number" value={form.radio_tolerancia_metros} onChange={e => set('radio_tolerancia_metros', e.target.value)} min="5" max="500" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>ORDEN EN RUTA</label>
          <input className={styles.input} type="number" value={form.orden} onChange={e => set('orden', e.target.value)} min="0" />
        </div>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.formActions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancelar}>Cancelar</button>
        <button type="submit" className={styles.saveBtn} disabled={guardando}>
          {guardando ? 'GUARDANDO...' : esEdicion ? 'GUARDAR CAMBIOS' : '+ CREAR PUNTO Y GENERAR QR'}
        </button>
      </div>
    </form>
  );
}

export default function Puntos() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const [puntos, setPuntos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [puntoQR, setPuntoQR] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { cargar(); }, [mostrarTodos]);

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await puntosAPI.listar(mostrarTodos);
      setPuntos(res.data.puntos || []);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  const handleCrear = async (data) => {
    setError('');
    setGuardando(true);
    try {
      const res = await puntosAPI.crear(data);
      setShowForm(false);
      await cargar();
      if (res.data.punto) setPuntoQR(res.data.punto);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al crear el punto');
    } finally { setGuardando(false); }
  };

  const handleEditar = async (data) => {
    setError('');
    setGuardando(true);
    try {
      await puntosAPI.actualizar(editando.id, data);
      setEditando(null);
      await cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al editar el punto');
    } finally { setGuardando(false); }
  };

  const handleToggle = async (punto) => {
    const accion = punto.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} el punto "${punto.nombre}"?`)) return;
    try {
      await puntosAPI.toggleActivo(punto.id);
      await cargar();
    } catch (e) { alert('Error al cambiar estado'); }
  };

  const handleEliminar = async (punto) => {
    if (!confirm(`¿Eliminar permanentemente "${punto.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await puntosAPI.eliminar(punto.id);
      await cargar();
    } catch (e) { alert('Error al eliminar'); }
  };

  const activosCount = puntos.filter(p => p.activo).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>PUNTOS QR</h1>
          <p className={styles.sub}>{activosCount} puntos activos{mostrarTodos && ` · ${puntos.length} total`}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className={styles.editBtn}
            onClick={() => setMostrarTodos(v => !v)}
          >
            {mostrarTodos ? 'Solo activos' : 'Ver todos'}
          </button>
          <button className={styles.addBtn} onClick={() => { setShowForm(v => !v); setEditando(null); }}>
            {showForm ? '✕ CANCELAR' : '+ NUEVO PUNTO'}
          </button>
        </div>
      </div>

      {showForm && !editando && (
        <FormPunto
          onGuardar={handleCrear}
          onCancelar={() => setShowForm(false)}
          guardando={guardando}
          error={error}
        />
      )}

      {editando && (
        <FormPunto
          inicial={editando}
          onGuardar={handleEditar}
          onCancelar={() => setEditando(null)}
          guardando={guardando}
          error={error}
        />
      )}

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
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="7" className={styles.loadingCell}>CARGANDO...</td></tr>
            ) : puntos.length === 0 ? (
              <tr><td colSpan="7" className={styles.loadingCell}>Sin puntos registrados. Crea el primero.</td></tr>
            ) : (
              puntos.map((p, i) => (
                <tr key={p.id} className={`${styles.row} ${!p.activo ? styles.rowInactiva : ''}`}>
                  <td className={styles.orderCell}>{p.orden || i + 1}</td>
                  <td>
                    <div className={styles.puntoNombre}>{p.nombre}</div>
                    {p.descripcion && <div className={styles.puntoDesc}>{p.descripcion}</div>}
                  </td>
                  <td><code className={styles.qrCode}>{p.qr_codigo}</code></td>
                  <td className={styles.monoCell}>
                    {p.latitud && p.longitud
                      ? `${parseFloat(p.latitud).toFixed(5)}, ${parseFloat(p.longitud).toFixed(5)}`
                      : <span style={{ color: 'var(--text-muted)' }}>Sin GPS</span>
                    }
                  </td>
                  <td className={styles.monoCell}>{p.radio_tolerancia_metros}m</td>
                  <td>
                    <span className={`badge ${p.activo ? 'badge-ok' : 'badge-off'}`}>
                      {p.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.qrBtn} onClick={() => setPuntoQR(p)} title="Ver e imprimir QR">
                        🖨 QR
                      </button>
                      <button className={styles.editBtn} onClick={() => { setEditando(p); setShowForm(false); setError(''); }} title="Editar">
                        ✏
                      </button>
                      {esAdmin && (
                        <button className={styles.editBtn} onClick={() => handleToggle(p)} title={p.activo ? 'Desactivar' : 'Activar'}>
                          {p.activo ? '⏸' : '▶'}
                        </button>
                      )}
                      {esAdmin && (
                        <button className={styles.deleteBtn} onClick={() => handleEliminar(p)} title="Eliminar">
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {puntoQR && <ModalQR punto={puntoQR} onClose={() => setPuntoQR(null)} />}
    </div>
  );
}

const modalStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, width: 420, overflow: 'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' },
  title: { color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: '4px 8px' },
  body: { padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 },
  info: { width: '100%', display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--bg)', borderRadius: 8, padding: 14 },
  infoRow: { display: 'flex', gap: 8, fontSize: 13 },
  infoLabel: { color: 'var(--text-muted)', minWidth: 60 },
  infoVal: { color: 'var(--text-primary)', fontFamily: 'monospace' },
  footer: { padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center' },
  printBtn: { background: 'var(--primary)', color: 'var(--bg)', border: 'none', borderRadius: 8, padding: '10px 32px', fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: 1 },
};
