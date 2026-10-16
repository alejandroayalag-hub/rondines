const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const auth = require('../middleware/auth');

/**
 * POST /api/push/registrar
 * La app móvil llama esto al iniciar sesión para registrar su ExpoPushToken.
 */
router.post('/registrar', auth(), async (req, res) => {
  const { token, plataforma = 'android' } = req.body;
  const usuario_id = req.usuario.id;

  if (!token) return res.status(400).json({ error: 'Token requerido' });

  try {
    // Upsert: si ya existe el par usuario-token, solo actualiza updated_at
    await pool.query(`
      INSERT INTO push_tokens (usuario_id, token, plataforma)
      VALUES ($1, $2, $3)
      ON CONFLICT (usuario_id, token)
      DO UPDATE SET activo = TRUE, updated_at = NOW()
    `, [usuario_id, token, plataforma]);

    res.json({ mensaje: 'Token registrado correctamente' });
  } catch (err) {
    console.error('Error registrando push token:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * DELETE /api/push/remover
 * Al cerrar sesión, desactiva el token para no enviar notificaciones.
 */
router.delete('/remover', auth(), async (req, res) => {
  const { token } = req.body;
  const usuario_id = req.usuario.id;

  try {
    await pool.query(
      'UPDATE push_tokens SET activo = FALSE WHERE usuario_id = $1 AND token = $2',
      [usuario_id, token]
    );
    res.json({ mensaje: 'Token removido' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
