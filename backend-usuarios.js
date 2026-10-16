const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../database/db');
const auth = require('../middleware/auth');

// Supervisor solo puede gestionar guardias, no admins ni otros supervisores
const soloGuardia = async (id, res) => {
  const r = await pool.query('SELECT rol FROM usuarios WHERE id=$1', [id]);
  if (!r.rows[0]) { res.status(404).json({ error: 'Usuario no encontrado' }); return false; }
  if (r.rows[0].rol !== 'guardia') { res.status(403).json({ error: 'Solo puedes gestionar guardias' }); return false; }
  return true;
};

// GET /api/usuarios
router.get('/', auth(['admin', 'supervisor']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre, email, rol, activo, created_at
       FROM usuarios ORDER BY rol ASC, nombre ASC`
    );
    res.json({ usuarios: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/usuarios
router.post('/', auth(['admin', 'supervisor']), async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email || !password || !rol)
    return res.status(400).json({ error: 'Nombre, email, contraseña y rol son requeridos' });

  // Supervisor solo puede crear guardias
  if (req.usuario.rol === 'supervisor' && rol !== 'guardia')
    return res.status(403).json({ error: 'Solo puedes crear cuentas de guardia' });
  if (!['guardia', 'supervisor', 'admin'].includes(rol))
    return res.status(400).json({ error: 'Rol inválido' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol, activo, created_at`,
      [nombre, email.toLowerCase().trim(), hash, rol]
    );
    res.status(201).json({ usuario: result.rows[0] });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'El email ya está registrado' });
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/usuarios/:id — edita nombre, email, rol
router.put('/:id', auth(['admin', 'supervisor']), async (req, res) => {
  const { nombre, email, rol } = req.body;
  if (!nombre || !email || !rol)
    return res.status(400).json({ error: 'Nombre, email y rol son requeridos' });

  // Supervisor: solo puede editar guardias y no puede cambiar rol a algo diferente de guardia
  if (req.usuario.rol === 'supervisor') {
    if (!(await soloGuardia(req.params.id, res))) return;
    if (rol !== 'guardia')
      return res.status(403).json({ error: 'Solo puedes asignar el rol de guardia' });
  }

  try {
    const result = await pool.query(
      `UPDATE usuarios SET nombre=$1, email=$2, rol=$3
       WHERE id=$4 RETURNING id, nombre, email, rol, activo`,
      [nombre, email.toLowerCase().trim(), rol, req.params.id]
    );
    if (!result.rows[0])
      return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ usuario: result.rows[0] });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'El email ya está en uso' });
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/usuarios/:id/password — cambia contraseña
router.patch('/:id/password', auth(['admin', 'supervisor']), async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

  if (req.usuario.rol === 'supervisor') {
    if (!(await soloGuardia(req.params.id, res))) return;
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'UPDATE usuarios SET password_hash=$1 WHERE id=$2 RETURNING id',
      [hash, req.params.id]
    );
    if (!result.rows[0])
      return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Contraseña actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/usuarios/:id/toggle — activa/desactiva (solo admin)
router.patch('/:id/toggle', auth(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE usuarios SET activo = NOT activo WHERE id=$1 RETURNING id, activo, nombre',
      [req.params.id]
    );
    if (!result.rows[0])
      return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ activo: result.rows[0].activo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/usuarios/:id (solo admin)
router.delete('/:id', auth(['admin']), async (req, res) => {
  if (req.params.id === req.usuario.id)
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
  try {
    await pool.query('DELETE FROM usuarios WHERE id=$1', [req.params.id]);
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
