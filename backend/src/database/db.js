// Redirige al Singleton oficial.
// Todos los modelos usan require('../database/db') sin cambios.
const { getDb } = require('../patterns/singleton');
module.exports = { getDb };
