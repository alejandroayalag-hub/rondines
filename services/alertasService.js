const cron = require('node-cron');
const pool = require('../database/db');
const { notificarSinEscaneo, notificarSOS, notificarFueraDeRango } = require('./pushService');

async function obtenerTokensSupervisores() {
  try {
    const result = await pool.query(`
      SELECT pt.token
      FROM push_tokens pt
      JOIN usuarios u ON pt.usuario_id = u.id
      WHERE pt.activo = TRUE AND u.activo = TRUE AND u.rol IN ('supervisor', 'admin')
    `);
    return result.rows.map(r => r.token);
  } catch (err) {
    console.error('Error obteniendo tokens:', err.message);
    return [];
  }
}

async function procesarAlertaSOS(guardia_id, mensaje) {
  try {
    const res = await pool.query('SELECT nombre FROM usuarios WHERE id = $1', [guardia_id]);
    const nombre = res.rows[0]?.nombre || 'Guardia';
    const tokens = await obtenerTokensSupervisores();
    if (tokens.length > 0) {
      const r = await notificarSOS(tokens, nombre, mensaje);
      console.log(`SOS Push enviado: ${r.enviados}/${tokens.length}`);
    }
  } catch (err) {
    console.error('Error push SOS:', err.message);
  }
}

async function procesarAlertaFueraDeRango(guardia_id, puntoNombre, distanciaMetros) {
  try {
    const res = await pool.query('SELECT nombre FROM usuarios WHERE id = $1', [guardia_id]);
    const nombre = res.rows[0]?.nombre || 'Guardia';
    const tokens = await obtenerTokensSupervisores();
    if (tokens.length > 0) {
      const r = await notificarFueraDeRango(tokens, nombre, puntoNombre, distanciaMetros);
      console.log(`Fuera de rango Push: ${r.enviados}/${tokens.length}`);
    }
  } catch (err) {
    console.error('Error push fuera de rango:', err.message);
  }
}

function iniciarMonitoreoAlertas() {
  const umbralMinutos = parseInt(process.env.ALERT_THRESHOLD_MINUTES) || 30;

  cron.schedule('*/5 * * * *', async () => {
    try {
      const result = await pool.query(`
        SELECT t.id as turno_id, t.guardia_id, u.nombre as guardia_nombre,
               MAX(e.timestamp) as ultimo_escaneo
        FROM turnos t
        JOIN usuarios u ON t.guardia_id = u.id
        LEFT JOIN escaneos e ON e.guardia_id = t.guardia_id AND e.timestamp > t.inicio
        WHERE t.activo = TRUE
        GROUP BY t.id, t.guardia_id, u.nombre
        HAVING MAX(e.timestamp) IS NULL
          OR MAX(e.timestamp) < NOW() - INTERVAL '${umbralMinutos} minutes'
      `);

      for (const guardia of result.rows) {
        const alertaExistente = await pool.query(`
          SELECT id FROM alertas
          WHERE guardia_id = $1 AND tipo = 'no_escaneo' AND resuelta = FALSE
            AND created_at > NOW() - INTERVAL '${umbralMinutos} minutes'
        `, [guardia.guardia_id]);

        if (alertaExistente.rows.length === 0) {
          const tiempoSinEscaneo = guardia.ultimo_escaneo
            ? 'Ultimo escaneo: ' + new Date(guardia.ultimo_escaneo).toLocaleTimeString('es-MX')
            : 'Sin ningun escaneo desde inicio de turno';

          const minutosReales = guardia.ultimo_escaneo
            ? Math.floor((new Date() - new Date(guardia.ultimo_escaneo)) / 60000)
            : umbralMinutos;

          // 1. Crear alerta en BD
          await pool.query(`
            INSERT INTO alertas (guardia_id, turno_id, tipo, mensaje)
            VALUES ($1, $2, 'no_escaneo', $3)
          `, [
            guardia.guardia_id,
            guardia.turno_id,
            guardia.guardia_nombre + ' lleva mas de ' + umbralMinutos + ' min sin escanear. ' + tiempoSinEscaneo
          ]);

          console.log('Alerta generada: ' + guardia.guardia_nombre + ' sin escaneo (' + minutosReales + ' min)');

          // 2. Push a supervisores
          const tokens = await obtenerTokensSupervisores();
          if (tokens.length > 0) {
            const r = await notificarSinEscaneo(tokens, guardia.guardia_nombre, minutosReales);
            console.log('Push sin_escaneo: ' + r.enviados + '/' + tokens.length + ' entregados');
          }
        }
      }
    } catch (err) {
      console.error('Error en monitoreo de alertas:', err.message);
    }
  });

  console.log('Monitoreo de alertas activo (umbral: ' + umbralMinutos + ' min)');
}

module.exports = { iniciarMonitoreoAlertas, procesarAlertaSOS, procesarAlertaFueraDeRango };
