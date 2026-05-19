require('dotenv').config();
const app = require('./app');
const { initDatabase } = require('./database/init');

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await initDatabase();
    console.log('[DB] Base de datos lista');
    app.listen(PORT, () => {
      console.log(`[SERVER] http://localhost:${PORT}`);
      console.log(`[SERVER] Health: http://localhost:${PORT}/api/health`);
    });
  } catch(err) {
    console.error('[FATAL]', err.message);
    process.exit(1);
  }
}

start();
