const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const auth = require('../middleware/auth');
const { procesarAlertaFueraDeRango } = require('../services/alertasService');

function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const dphi = (lat2 - lat1) * Math.PI / 180;
  const dlambda = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dphi/2) * Math.sin(dphi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(dlambda/2) * Math.sin(dlambda/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// POST /api/escaneos
router.post('/', auth(['guardia', 'supervisor', 'admin']), async (req, res) => {
  const { qr_codigo, latitud, longitud, precision_gps, turno_id, notas } = req.body;
  const guardia_id = req.usuario.id;
  if (!qr_codigo || latitud === undefined || longitud === undefined)
    return res.status(400).json({ error: 'qr_codigo, latitud y longitud son requeridos' });

  try {
    const puntoResult = await pool.query(
      'SELECT * FROM puntos_rondin WHERE qr_codigo = $1 AND activo = TRUE', [qr_codigo]
    );
    if (puntoResult.rows.length === 0)
      return res.status(404).json({ error: 'Codigo QR no reconocido o inactivo' });

    const punto = puntoResult.rows[0];
    let dentro_de_rango = false, distancia_metros = null;

    if (punto.latitud && punto.longitud) {
      distancia_metros = calcularDistancia(
        parseFloat(latitud), parseFloat(longitud),
        parseFloat(punto.latitud), parseFloat(punto.longitud)
      );
      dentro_de_rango = distancia_metros <= punto.radio_tolerancia_metros;
    }

    const escaneoResult = await pool.query(`
      INSERT INTO escaneos (guardia_id, punto_id, turno_id, latitud, longitud, precision_gps, dentro_de_rango, notas)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [guardia_id, punto.id, turno_id || null, latitud, longitud, precision_gps || null, dentro_de_rango, notas || null]);

    if (!dentro_de_rango && punto.latitud) {
      await pool.query(`
        INSERT INTO alertas (guardia_id, turno_id, tipo, mensaje)
        VALUES ($1, $2, 'fuera_de_rango', $3)
      `, [guardia_id, turno_id || null,
        'Escaneo del punto "' + punto.nombre + '" a ' + Math.round(distancia_metros) + 'm (maximo: ' + punto.radio_tolerancia_metros + 'm)'
      ]);
      // Push a supervisores en background
      procesarAlertaFueraDeRango(guardia_id, punto.nombre, Math.round(distancia_metros)).catch(console.error);
    }

    res.status(201).json({
      mensaje: 'Escaneo registrado exitosamente',
      escaneo: escaneoResult.rows[0],
      punto: { id: punto.id, nombre: punto.nombre, descripcion: punto.descripcion },
      validacion: {
        dentro_de_rango,
        distancia_metros: distancia_metros ? Math.round(distancia_metros) : null,
        radio_tolerancia: punto.radio_tolerancia_metros,
      }
    });
  } catch (err) {
    console.error('Error al registrar escaneo:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/escaneos
router.get('/', auth(['supervisor', 'admin']), async (req, res) => {
  const { guardia_id, fecha_inicio, fecha_fin, punto_id, limit = 50, offset = 0 } = req.query;
  let conditions = [], params = [], idx = 1;
  if (guardia_id) { conditions.push(`e.guardia_id = $${idx++}`); params.push(guardia_id); }
  if (punto_id) { conditions.push(`e.punto_id = $${idx++}`); params.push(punto_id); }
  if (fecha_inicio) { conditions.push(`e.timestamp >= $${idx++}`); params.push(fecha_inicio); }
  if (fecha_fin) { conditions.push(`e.timestamp <= $${idx++}`); params.push(fecha_fin); }
  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  try {
    const result = await pool.query(`
      SELECT e.*, u.nombre as guardia_nombre, p.nombre as punto_nombre, p.qr_codigo
      FROM escaneos e
      JOIN usuarios u ON e.guardia_id = u.id
      JOIN puntos_rondin p ON e.punto_id = p.id
      ${where} ORDER BY e.timestamp DESC LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, limit, offset]);
    res.json({ escaneos: result.rows, total: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/escaneos/mis-escaneos
router.get('/mis-escaneos', auth(['guardia']), async (req, res) => {
  const guardia_id = req.usuario.id;
  const { fecha } = req.query;
  const dateFilter = fecha ? 'AND DATE(e.timestamp) = $2' : 'AND DATE(e.timestamp) = CURRENT_DATE';
  const params = fecha ? [guardia_id, fecha] : [guardia_id];
  try {
    const result = await pool.query(`
      SELECT e.*, p.nombre as punto_nombre, p.descripcion as punto_descripcion
      FROM escaneos e JOIN puntos_rondin p ON e.punto_id = p.id
      WHERE e.guardia_id = $1 ${dateFilter} ORDER BY e.timestamp DESC
    `, params);
    res.json({ escaneos: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
