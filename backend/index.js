require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { iniciarMonitoreoAlertas } = require('./services/alertasService');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de peticiones en desarrollo
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ── Rutas ───────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/push',      require('./routes/push'));
app.use('/api/escaneos',  require('./routes/escaneos'));
app.use('/api/turnos',    require('./routes/turnos'));
app.use('/api/alertas',   require('./routes/alertas'));
app.use('/api/puntos',    require('./routes/puntos'));
app.use('/api/reportes',  require('./routes/reportes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Iniciar servidor ────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('🛡️  Rondines API - Servidor iniciado');
  console.log(`🚀  Puerto: ${PORT}`);
  console.log(`🌍  Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('📋 Endpoints disponibles:');
  console.log(`   POST   /api/auth/login`);
  console.log(`   POST   /api/escaneos`);
  console.log(`   GET    /api/escaneos/mis-escaneos`);
  console.log(`   POST   /api/turnos/iniciar`);
  console.log(`   PUT    /api/turnos/terminar`);
  console.log(`   GET    /api/alertas`);
  console.log(`   POST   /api/alertas/sos`);
  console.log(`   GET    /api/reportes/resumen`);
  console.log(`   GET    /api/reportes/actividad-tiempo-real`);
  console.log('');

  // Iniciar monitoreo automático de alertas
  iniciarMonitoreoAlertas();
});

module.exports = app;
