import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { reportesAPI, puntosAPI } from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import 'leaflet/dist/leaflet.css';
import styles from './Mapa.module.css';

// Iconos personalizados
const iconGuardia = (estado) => L.divIcon({
  className: '',
  html: `<div style="
    width:36px; height:36px;
    background:${estado === 'ok' ? '#00FF88' : estado === 'warning' ? '#FFD60A' : '#FF2D55'};
    border:2px solid #080C14;
    border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:16px;
    box-shadow: 0 0 16px ${estado === 'ok' ? 'rgba(0,255,136,0.6)' : estado === 'warning' ? 'rgba(255,214,10,0.6)' : 'rgba(255,45,85,0.6)'};
  ">👤</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const iconPunto = L.divIcon({
  className: '',
  html: `<div style="
    width:24px; height:24px;
    background:#0D1526;
    border:2px solid #00FF88;
    border-radius:4px;
    display:flex; align-items:center; justify-content:center;
    font-size:11px;
    box-shadow: 0 0 8px rgba(0,255,136,0.4);
  ">◎</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Centro de Uruapan por defecto
const CENTER_DEFAULT = [19.4195, -102.0630];

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, 16); }, [center, map]);
  return null;
}

export default function Mapa() {
  const [guardias, setGuardias] = useState([]);
  const [puntos, setPuntos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const [gRes, pRes] = await Promise.all([
        reportesAPI.actividadTiempoReal(),
        puntosAPI.listar(),
      ]);
      setGuardias(gRes.data.guardias_activos || []);
      setPuntos(pRes.data.puntos || []);
      setUltimaActualizacion(new Date());
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 20000);
    return () => clearInterval(interval);
  }, [cargar]);

  const estadoGuardia = (g) => {
    if (!g.ultimo_escaneo) return 'sin';
    const mins = Math.floor((new Date() - new Date(g.ultimo_escaneo)) / 60000);
    if (mins < 30) return 'ok';
    if (mins < 60) return 'warning';
    return 'danger';
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>MAPA EN VIVO</h1>
          <p className={styles.sub}>
            {guardias.length} guardia{guardias.length !== 1 ? 's' : ''} activo{guardias.length !== 1 ? 's' : ''} ·&nbsp;
            {puntos.length} puntos de rondín
          </p>
        </div>
        <div className={styles.headerRight}>
          {ultimaActualizacion && (
            <span className={styles.updated}>↻ {format(ultimaActualizacion, 'HH:mm:ss')}</span>
          )}
          <button className={styles.refreshBtn} onClick={cargar}>ACTUALIZAR</button>
        </div>
      </div>

      <div className={styles.mapLayout}>
        {/* Sidebar de guardias */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarTitle}>GUARDIAS EN TURNO</div>
          {guardias.length === 0 ? (
            <div className={styles.empty}>Sin guardias activos</div>
          ) : (
            guardias.map((g) => {
              const estado = estadoGuardia(g);
              const mins = g.ultimo_escaneo
                ? Math.floor((new Date() - new Date(g.ultimo_escaneo)) / 60000)
                : null;

              return (
                <div
                  key={g.id}
                  className={`${styles.guardiaCard} ${seleccionado === g.id ? styles.cardSelected : ''}`}
                  onClick={() => setSeleccionado(seleccionado === g.id ? null : g.id)}
                >
                  <div className={`${styles.dot} ${styles[`dot_${estado}`]}`} />
                  <div className={styles.guardiaInfo}>
                    <div className={styles.guardiaNombre}>{g.nombre}</div>
                    <div className={styles.guardiaUltimo}>
                      {g.ultimo_punto ? `↳ ${g.ultimo_punto}` : 'Sin escaneos aún'}
                    </div>
                    {mins !== null && (
                      <div className={`${styles.guardiaTime} ${estado === 'danger' ? styles.timeDanger : estado === 'warning' ? styles.timeWarning : styles.timeOk}`}>
                        {mins < 60 ? `${mins} min sin escanear` : `${Math.floor(mins/60)}h ${mins%60}m`}
                      </div>
                    )}
                  </div>
                  <span className={`badge ${estado === 'ok' ? 'badge-ok' : estado === 'warning' ? 'badge-warning' : estado === 'danger' ? 'badge-danger' : 'badge-off'}`}>
                    {estado === 'ok' ? 'OK' : estado === 'warning' ? 'TARDE' : estado === 'danger' ? 'ALERTA' : 'N/A'}
                  </span>
                </div>
              );
            })
          )}

          {/* Leyenda */}
          <div className={styles.legend}>
            <div className={styles.legendTitle}>LEYENDA</div>
            <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.dot_ok}`}/>OK — activo</div>
            <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.dot_warning}`}/>30-60 min sin escaneo</div>
            <div className={styles.legendItem}><span className={`${styles.legendDot} ${styles.dot_danger}`}/>+60 min · ALERTA</div>
            <div className={styles.legendItem}><span className={styles.legendPunto}/>Punto de rondín</div>
          </div>
        </div>

        {/* Mapa */}
        <div className={styles.mapWrapper}>
          <MapContainer
            center={CENTER_DEFAULT}
            zoom={16}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap"
            />

            {/* Puntos de rondín */}
            {puntos.map((p) => (
              p.latitud && p.longitud ? (
                <div key={p.id}>
                  <Marker
                    position={[parseFloat(p.latitud), parseFloat(p.longitud)]}
                    icon={iconPunto}
                  >
                    <Popup className={styles.popup}>
                      <div className={styles.popupContent}>
                        <strong>{p.nombre}</strong>
                        <span className="badge badge-ok">QR: {p.qr_codigo}</span>
                        <span>Radio: {p.radio_tolerancia_metros}m</span>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={[parseFloat(p.latitud), parseFloat(p.longitud)]}
                    radius={p.radio_tolerancia_metros || 50}
                    pathOptions={{ color: '#00FF88', fillColor: '#00FF88', fillOpacity: 0.06, weight: 1 }}
                  />
                </div>
              ) : null
            ))}

            {/* Guardias — posición del último escaneo */}
            {guardias.map((g) => {
              // En una implementación real, el último escaneo traería la ubicación
              // Aquí ponemos una posición aproximada para demo
              return null;
            })}
          </MapContainer>

          {/* Overlay de info */}
          <div className={styles.mapOverlay}>
            <div className={styles.overlayItem}>
              <span className={styles.overlayDot} />
              <span>{puntos.length} PUNTOS QR ACTIVOS</span>
            </div>
            <div className={styles.overlayItem}>
              <span className={styles.overlayDotGuard} />
              <span>{guardias.length} GUARDIAS EN TURNO</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
