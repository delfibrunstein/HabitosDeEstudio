const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'planificador_secret_key';

/**
 * Genera un token JWT para un estudiante.
 */
function generarToken(estudianteId) {
  return jwt.sign({ id: estudianteId }, SECRET, { expiresIn: '7d' });
}

/**
 * Middleware que verifica el JWT enviado en Authorization: Bearer <token>.
 * Si es válido, agrega req.estudianteId con el id del estudiante.
 */
function verificarToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido.' });
  }
  try {
    const payload = jwt.verify(auth.slice(7), SECRET);
    req.estudianteId = payload.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

module.exports = { generarToken, verificarToken };
