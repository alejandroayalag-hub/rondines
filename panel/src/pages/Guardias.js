import { useState, useEffect } from 'react';
import { usuariosAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from './Guardias.module.css';

const ROL_LABEL = { admin: 'Admin', supervisor: 'Supervisor', guardia: 'Guardia' };
const ROL_BADGE = { admin: 'badge-warn', supervisor: 'badge-info', guardia: 'badge-ok' };

const FORM_VACIO = { nombre: '', email: '', password: '', rol: 'guardia' };

function Modal({ titulo, onClose, children }) {
  return (
    <div style={modalSt.overlay} onClick={onClose}>
      <div style={modalSt.modal} onClick={e => e.stopPropagation()}>
        <div style={modalSt.header}>
          <span style={modalSt.title}>{titulo}</span>
          <button style={modalSt.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={modalSt.body}>{children}</div>
      </div>
    </div>
  );
}

function FormUsuario({ inicial, onGuardar, onCancelar, guardando, error, soloGuardia }) {
  const esEdicion = Boolean(inicial?.id);
  const [form, setForm] = useState(
    esEdicion
      ? { nombre: inicial.nombre, email: inicial.email, rol: inicial.rol, password: '' }
      : FORM_VACIO
  );
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onGuardar(form); }} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label}>NOMBRE COMPLETO *</label>
        <input className={styles.input} value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Lorenzo García" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>EMAIL *</label>
        <input className={styles.input} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="guardia@grupoata.com" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>{esEdicion ? 'NUEVA CONTRASEÑA (dejar vacío = sin cambio)' : 'CONTRASEÑA *'}</label>
        <input className={styles.input} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" required={!esEdicion} minLength={form.password ? 6 : undefined} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>ROL *</label>
        <select className={styles.input} value={form.rol} onChange={e => set('rol', e.target.value)} disabled={soloGuardia}>
          <option value="guardia">Guardia</option>
          {!soloGuardia && <option value="supervisor">Supervisor</option>}
          {!soloGuardia && <option value="admin">Admin</option>}
        </select>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.formActions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancelar}>Cancelar</button>
        <button type="submit" className={styles.saveBtn} disabled={guardando}>
          {guardando ? 'GUARDANDO...' : esEdicion ? 'GUARDAR CAMBIOS' : 'CREAR USUARIO'}
        </button>
      </div>
    </form>
  );
}

export default function Guardias() {
  const { usuario: yo } = useAuth();
  const esAdmin = yo?.rol === 'admin';
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null); // 'crear' | 'editar' | 'password'
  const [seleccionado, setSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [nuevaPass, setNuevaPass] = useState('');

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await usuariosAPI.listar();
      setUsuarios(res.data.usuarios || []);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  const cerrarModal = () => { setModal(null); setSeleccionado(null); setError(''); setNuevaPass(''); };

  const handleCrear = async (form) => {
    setError(''); setGuardando(true);
    try {
      await usuariosAPI.crear(form);
      cerrarModal();
      await cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al crear usuario');
    } finally { setGuardando(false); }
  };

  const handleEditar = async (form) => {
    setError(''); setGuardando(true);
    try {
      await usuariosAPI.actualizar(seleccionado.id, { nombre: form.nombre, email: form.email, rol: form.rol });
      if (form.password) {
        await usuariosAPI.cambiarPassword(seleccionado.id, form.password);
      }
      cerrarModal();
      await cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al editar usuario');
    } finally { setGuardando(false); }
  };

  const handleToggle = async (u) => {
    const accion = u.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} a "${u.nombre}"?`)) return;
    try {
      await usuariosAPI.toggleActivo(u.id);
      await cargar();
    } catch (e) { alert('Error al cambiar estado'); }
  };

  const handleEliminar = async (u) => {
    if (!confirm(`¿Eliminar permanentemente a "${u.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await usuariosAPI.eliminar(u.id);
      await cargar();
    } catch (e) { alert(e.response?.data?.error || 'Error al eliminar'); }
  };

  const activosCount = usuarios.filter(u => u.activo).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>GUARDIAS Y USUARIOS</h1>
          <p className={styles.sub}>{activosCount} activos · {usuarios.length} total</p>
        </div>
        <button className={styles.addBtn} onClick={() => setModal('crear')}>
          + NUEVO USUARIO
        </button>
      </div>

      {/* Tarjetas resumen */}
      <div className={styles.statsRow}>
        {['admin', 'supervisor', 'guardia'].map(rol => {
          const count = usuarios.filter(u => u.rol === rol).length;
          const activos = usuarios.filter(u => u.rol === rol && u.activo).length;
          return (
            <div key={rol} className={styles.statCard}>
              <div className={styles.statNum}>{activos}</div>
              <div className={styles.statLabel}>{ROL_LABEL[rol]}s activos</div>
              {count !== activos && <div className={styles.statSub}>{count - activos} inactivo(s)</div>}
            </div>
          );
        })}
      </div>

      {/* Tabla */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>NOMBRE</th>
              <th>EMAIL</th>
              <th>ROL</th>
              <th>ESTADO</th>
              <th>REGISTRO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="6" className={styles.loadingCell}>CARGANDO...</td></tr>
            ) : usuarios.length === 0 ? (
              <tr><td colSpan="6" className={styles.loadingCell}>Sin usuarios registrados.</td></tr>
            ) : (
              usuarios.map(u => (
                <tr key={u.id} className={`${styles.row} ${!u.activo ? styles.rowInactiva : ''}`}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={styles.avatar}>{u.nombre.charAt(0).toUpperCase()}</div>
                      <span className={styles.userName}>{u.nombre}</span>
                    </div>
                  </td>
                  <td className={styles.emailCell}>{u.email}</td>
                  <td>
                    <span className={`badge ${ROL_BADGE[u.rol] || 'badge-ok'}`}>
                      {ROL_LABEL[u.rol] || u.rol}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.activo ? 'badge-ok' : 'badge-off'}`}>
                      {u.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td className={styles.dateCell}>
                    {new Date(u.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.editBtn} title="Editar" onClick={() => { setSeleccionado(u); setModal('editar'); setError(''); }}>✏</button>
                      {esAdmin && (
                        <button className={styles.editBtn} title={u.activo ? 'Desactivar' : 'Activar'} onClick={() => handleToggle(u)}>
                          {u.activo ? '⏸' : '▶'}
                        </button>
                      )}
                      {esAdmin && (
                        <button className={styles.deleteBtn} title="Eliminar" onClick={() => handleEliminar(u)}>✕</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal crear */}
      {modal === 'crear' && (
        <Modal titulo="◎ NUEVO USUARIO" onClose={cerrarModal}>
          <FormUsuario onGuardar={handleCrear} onCancelar={cerrarModal} guardando={guardando} error={error} soloGuardia={!esAdmin} />
        </Modal>
      )}

      {/* Modal editar */}
      {modal === 'editar' && seleccionado && (
        <Modal titulo={`✏ EDITAR — ${seleccionado.nombre}`} onClose={cerrarModal}>
          <FormUsuario inicial={seleccionado} onGuardar={handleEditar} onCancelar={cerrarModal} guardando={guardando} error={error} soloGuardia={!esAdmin} />
        </Modal>
      )}
    </div>
  );
}

const modalSt = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, width: 460, overflow: 'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' },
  title: { color: 'var(--text-primary)', fontWeight: 700, fontSize: 13, letterSpacing: 1 },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: '4px 8px' },
  body: { padding: 24 },
};
