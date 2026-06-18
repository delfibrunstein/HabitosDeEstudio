const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Carpeta para uploads temporales
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',           require('./routes/auth.routes'));
app.use('/api/planes',         require('./routes/planes.routes'));
app.use('/api/materias',       require('./routes/materias.routes'));
app.use('/api/estudiantes',    require('./routes/estudiantes.routes'));
app.use('/api/recomendaciones',require('./routes/recomendaciones.routes'));
app.use('/api/ia',             require('./routes/ia.routes'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

module.exports = app;
