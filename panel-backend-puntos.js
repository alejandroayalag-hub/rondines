const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../database/db');
const auth = require('../middleware/auth');

// GET /api/puntos
router.get('/', auth(['guardia', 'supervisor', 'admin']), async (req, res) => {
  try {
    const { todos } = req.query;
    const sql = todos
      ? 'SELECT * FROM puntos_rondin ORDER BY orden ASC, nombre ASC'
      : 'SELECT * FROM puntos_rondin WHERE activo = TRUE ORDER BY orden ASC, nombre ASC';
    const result = await pool.query(sql);
    res.json({ puntos: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/puntos
router.post('/', auth(['supervisor', 'admin']), async (req, res) => {
  const { sitio_id, nombre, descripcion, latitud, longitud, radio_tolerancia_metros, orden } = req.body;
  if (!nombre)
    return res.status(400).json({ error: 'El nombre del punto es requerido' });

  // Auto-generar código QR único
  const qr_codigo = `RONGR-${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;

  try {
    const result = await pool.query(
      `INSERT INTO puntos_rondin (sitio_id, nombre, descripcion, qr_codigo, latitud, longitud, radio_tolerancia_metros, orden)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [sitio_id || null, nombre, descripcion || null, qr_codigo,
       latitud || null, longitud || null, radio_tolerancia_metros || 50, orden || 0]
    );
    res.status(201).json({ punto: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/puntos/:id
router.put('/:id', auth(['supervisor', 'admin']), async (req, res) => {
  const { nombre, descripcion, latitud, longitud, radio_tolerancia_metros, orden } = req.body;
  if (!nombre)
    return res.status(400).json({ error: 'El nombre del punto es requerido' });

  try {
    const result = await pool.query(
      `UPDATE puntos_rondin
       SET nombre=$1, descripcion=$2, latitud=$3, longitud=$4, radio_tolerancia_metros=$5, orden=$6
       WHERE id=$7 RETURNING *`,
      [nombre, descripcion || null, latitud || null, longitud || null,
       radio_tolerancia_metros || 50, orden || 0, req.params.id]
    );
    if (!result.rows[0])
      return res.status(404).json({ error: 'Punto no encontrado' });
    res.json({ punto: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/puntos/:id/toggle — activa o desactiva el punto
router.patch('/:id/toggle', auth(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE puntos_rondin SET activo = NOT activo WHERE id=$1 RETURNING id, activo',
      [req.params.id]
    );
    if (!result.rows[0])
      return res.status(404).json({ error: 'Punto no encontrado' });
    res.json({ activo: result.rows[0].activo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/puntos/:id — elimina permanentemente
router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    await pool.query('DELETE FROM puntos_rondin WHERE id=$1', [req.params.id]);
    res.json({ mensaje: 'Punto eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
